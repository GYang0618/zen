import { withZenMessageTiming } from '@zen/shared'

import type { ThreadMessage } from './copilot-thread.service.js'

const FETCH_TIMEOUT_MS = 5_000
const THREAD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const USER_KINDS = new Set(['human', 'user'])
const ASSISTANT_KINDS = new Set(['ai', 'assistant'])
const TOOL_KIND = 'tool'

export interface LangGraphDisplayProjection {
  messages: ThreadMessage[]
  startedAt?: Date
  endedAt?: Date
}

/** 图已经空闲、但展示表还没写入时，用检查点还原可回放的消息。 */
export async function loadIdleLangGraphProjection(
  deploymentUrl: string,
  threadId: string
): Promise<LangGraphDisplayProjection | null> {
  if (!THREAD_ID_PATTERN.test(threadId)) return null
  const base = deploymentUrl.replace(/\/$/, '')
  const [thread, state] = await Promise.all([
    readJson(`${base}/threads/${threadId}`),
    readJson(`${base}/threads/${threadId}/state`)
  ])
  if (!isIdleThread(thread)) return null

  const clock = readClock(thread)
  const messages = stampWorkWindow(projectMessages(readStateMessages(state)), clock)
  if (messages.length === 0) return null
  return { messages, ...clock }
}

function projectMessages(raw: unknown[]): ThreadMessage[] {
  return raw.flatMap((item) => projectMessage(item))
}

function projectMessage(value: unknown): ThreadMessage[] {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0) return []
  const kind = readKind(value)
  if (!kind) return []
  if (USER_KINDS.has(kind)) return [textMessage(value, 'user')]
  if (kind === TOOL_KIND) return projectToolMessage(value)
  if (!ASSISTANT_KINDS.has(kind)) return []
  return projectAssistantMessage(value)
}

function projectAssistantMessage(message: Record<string, unknown>): ThreadMessage[] {
  const id = message.id
  if (typeof id !== 'string') return []
  const reasoning = readReasoning(message)
  const assistant = textMessage(message, 'assistant')
  const toolCalls = readToolCalls(message)
  if (toolCalls) assistant.toolCalls = toolCalls
  if (!reasoning) return [assistant]
  return [{ id: `${id}:reasoning`, role: 'reasoning', content: reasoning }, assistant]
}

function projectToolMessage(message: Record<string, unknown>): ThreadMessage[] {
  const toolCallId = readString(message.tool_call_id)
  if (!toolCallId) return []
  return [{ ...textMessage(message, 'tool'), toolCallId }]
}

function textMessage(message: Record<string, unknown>, role: string): ThreadMessage {
  return { id: String(message.id), role, content: readContent(message.content) }
}

function readToolCalls(message: Record<string, unknown>): ThreadMessage['toolCalls'] {
  if (!Array.isArray(message.tool_calls)) return undefined
  const toolCalls = message.tool_calls.flatMap((item) => {
    if (!isRecord(item)) return []
    const id = readString(item.id)
    const name = readString(item.name)
    if (!id || !name) return []
    const args = readArguments(item.args)
    return [{ id, type: 'function' as const, name, args, function: { name, arguments: args } }]
  })
  return toolCalls.length > 0 ? toolCalls : undefined
}

function stampWorkWindow(
  messages: ThreadMessage[],
  clock: { startedAt?: Date; endedAt?: Date }
): ThreadMessage[] {
  const startedAt = clock.startedAt?.getTime()
  const endedAt = clock.endedAt?.getTime()
  if (startedAt === undefined || endedAt === undefined || endedAt < startedAt) return messages
  const index = messages.findIndex((message) => message.role === 'user')
  const message = index >= 0 ? messages[index] : undefined
  if (!message) return messages
  const next = [...messages]
  next[index] = {
    ...message,
    metadata: withZenMessageTiming(message.metadata, {
      workStartedAt: startedAt,
      workEndedAt: endedAt
    })
  }
  return next
}

function readStateMessages(state: unknown): unknown[] {
  if (!isRecord(state) || !isRecord(state.values) || !Array.isArray(state.values.messages))
    return []
  return state.values.messages
}

function isIdleThread(thread: unknown): boolean {
  return isRecord(thread) && thread.status === 'idle'
}

function readClock(thread: unknown): { startedAt?: Date; endedAt?: Date } {
  if (!isRecord(thread)) return {}
  return { startedAt: readDate(thread.created_at), endedAt: readDate(thread.updated_at) }
}

function readKind(message: Record<string, unknown>): string | undefined {
  return readString(message.type) ?? readString(message.role)
}

function readReasoning(message: Record<string, unknown>): string | undefined {
  if (!isRecord(message.additional_kwargs)) return undefined
  return readString(message.additional_kwargs.reasoning_content)
}

function readContent(value: unknown): string {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  return value
    .flatMap((part) => {
      if (typeof part === 'string') return [part]
      if (isRecord(part) && typeof part.text === 'string') return [part.text]
      return []
    })
    .join('\n')
}

function readArguments(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === undefined) return ''
  return JSON.stringify(value)
}

function readDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

async function readJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
