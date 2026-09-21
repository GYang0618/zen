import { stripCopilotDisplayMessages } from '@zen/shared'

import type { CopilotDisplayMessageRole } from '@zen/shared'
import type { ThreadMessage } from './copilot-thread.service.js'

const REASONING_ROLE: CopilotDisplayMessageRole = 'reasoning'
const ACTIVITY_ROLE: CopilotDisplayMessageRole = 'activity'

interface SseToolCall {
  id: string
  name: string
  args: string
}

export interface ParsedCopilotSseResult {
  messages: ThreadMessage[]
  threadId?: string
  runId?: string
}

interface RunRequestBody {
  threadId?: string
  messages?: Array<{ role: string }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function applyMessagesSnapshot(
  current: ThreadMessage[],
  snapshot: ThreadMessage[]
): ThreadMessage[] {
  const snapshotById = new Map(snapshot.map((message) => [message.id, message]))
  const snapshotHasReasoning = snapshot.some((message) => message.role === REASONING_ROLE)
  const snapshotHasActivity = snapshot.some((message) => message.role === ACTIVITY_ROLE)
  const preserveLocal = (message: ThreadMessage) =>
    (message.role === ACTIVITY_ROLE && !snapshotHasActivity) ||
    (message.role === REASONING_ROLE && !snapshotHasReasoning)

  const next = current
    .filter((message) => preserveLocal(message) || snapshotById.has(message.id))
    .map((message) => (preserveLocal(message) ? message : snapshotById.get(message.id)!))

  const seen = new Set(next.map((message) => message.id))
  for (const message of snapshot) {
    if (!seen.has(message.id)) next.push(message)
  }
  return next
}

function normalizeSnapshotMessage(raw: unknown): ThreadMessage | null {
  if (!isRecord(raw)) return null
  const id = readString(raw.id)
  const role = readString(raw.role)
  if (!id || !role) return null

  const message: ThreadMessage = { id, role }
  if (typeof raw.content === 'string') {
    message.content = raw.content
  }
  if (typeof raw.toolCallId === 'string') {
    message.toolCallId = raw.toolCallId
  }
  if (Array.isArray(raw.toolCalls)) {
    const toolCalls = raw.toolCalls.flatMap((item) => {
      if (!isRecord(item)) return []
      const toolId = readString(item.id)
      if (!toolId) return []
      const fn = isRecord(item.function) ? item.function : undefined
      const name = readString(item.name) ?? readString(fn?.name)
      const args = readString(item.args) ?? readString(fn?.arguments)
      return [
        {
          id: toolId,
          name: name ?? '',
          args: args ?? '',
          ...(fn
            ? {
                function: {
                  name: readString(fn.name) ?? name ?? '',
                  arguments: readString(fn.arguments) ?? args ?? ''
                }
              }
            : name
              ? { function: { name, arguments: args ?? '' } }
              : {})
        }
      ]
    })
    if (toolCalls.length > 0) message.toolCalls = toolCalls
  }
  return message
}

function upsertMessage(messages: ThreadMessage[], message: ThreadMessage): void {
  const index = messages.findIndex((item) => item.id === message.id)
  if (index === -1) {
    messages.push(message)
    return
  }
  messages[index] = { ...messages[index], ...message }
}

function appendContent(messages: ThreadMessage[], messageId: string, delta: string, role: string) {
  const existing = messages.find((item) => item.id === messageId)
  if (existing) {
    existing.content = (existing.content ?? '') + delta
    return
  }
  messages.push({ id: messageId, role, content: delta })
}

/**
 * 从 AG-UI SSE 重建会话消息：在 CopilotKit 官方解析之上补齐 reasoning，
 * 并用与客户端相同的策略把思考消息合并进 MESSAGES_SNAPSHOT。
 */
export function parseCopilotSseThreadMessages(text: string): ParsedCopilotSseResult {
  if (!text.trim()) return { messages: [] }

  let threadId: string | undefined
  let runId: string | undefined
  const messages: ThreadMessage[] = []
  const toolCallsById = new Map<string, SseToolCall>()
  const toolCallParent = new Map<string, string>()

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) continue

    let event: Record<string, unknown>
    try {
      const parsed: unknown = JSON.parse(trimmed.slice(5).trim())
      if (!isRecord(parsed)) continue
      event = parsed
    } catch {
      continue
    }

    const type = readString(event.type)
    switch (type) {
      case 'RUN_STARTED':
        threadId = readString(event.threadId) ?? threadId
        runId = readString(event.runId) ?? runId
        break
      case 'MESSAGES_SNAPSHOT': {
        if (!Array.isArray(event.messages)) break
        const snapshot = event.messages
          .map((item) => normalizeSnapshotMessage(item))
          .filter((item): item is ThreadMessage => item !== null)
        const merged = applyMessagesSnapshot(messages, snapshot)
        messages.splice(0, messages.length, ...merged)
        break
      }
      case 'TEXT_MESSAGE_START': {
        const messageId = readString(event.messageId)
        if (!messageId) break
        upsertMessage(messages, {
          id: messageId,
          role: readString(event.role) ?? 'assistant',
          content: ''
        })
        break
      }
      case 'TEXT_MESSAGE_CONTENT':
      case 'TEXT_MESSAGE_CHUNK': {
        const messageId = readString(event.messageId)
        if (!messageId) break
        appendContent(
          messages,
          messageId,
          readString(event.delta) ?? '',
          readString(event.role) ?? 'assistant'
        )
        break
      }
      case 'REASONING_MESSAGE_START':
      case 'THINKING_TEXT_MESSAGE_START': {
        const messageId = readString(event.messageId)
        if (!messageId) break
        upsertMessage(messages, { id: messageId, role: REASONING_ROLE, content: '' })
        break
      }
      case 'REASONING_MESSAGE_CONTENT':
      case 'THINKING_TEXT_MESSAGE_CONTENT': {
        const messageId = readString(event.messageId)
        if (!messageId) break
        appendContent(messages, messageId, readString(event.delta) ?? '', REASONING_ROLE)
        break
      }
      case 'TOOL_CALL_START':
      case 'TOOL_CALL_CHUNK': {
        const toolCallId = readString(event.toolCallId)
        if (!toolCallId) break
        const existing = toolCallsById.get(toolCallId)
        const toolCall = existing ?? {
          id: toolCallId,
          name: readString(event.toolCallName) ?? '',
          args: ''
        }
        if (readString(event.toolCallName)) toolCall.name = readString(event.toolCallName) ?? ''
        toolCall.args += readString(event.delta) ?? ''
        toolCallsById.set(toolCallId, toolCall)
        const parentId = readString(event.parentMessageId)
        if (parentId) toolCallParent.set(toolCallId, parentId)
        break
      }
      case 'TOOL_CALL_ARGS': {
        const toolCallId = readString(event.toolCallId)
        if (!toolCallId) break
        const toolCall = toolCallsById.get(toolCallId)
        if (toolCall) toolCall.args += readString(event.delta) ?? ''
        break
      }
      case 'TOOL_CALL_END': {
        const toolCallId = readString(event.toolCallId)
        if (!toolCallId) break
        attachToolCall(messages, toolCallsById.get(toolCallId), toolCallParent.get(toolCallId))
        break
      }
      case 'TOOL_CALL_RESULT': {
        const messageId = readString(event.messageId)
        const toolCallId = readString(event.toolCallId)
        if (!messageId) break
        let resultContent = event.content
        if (Array.isArray(resultContent)) {
          resultContent = resultContent
            .filter((part) => isRecord(part) && typeof part.text === 'string')
            .map((part) => (part as { text: string }).text)
            .join('')
        }
        upsertMessage(messages, {
          id: messageId,
          role: 'tool',
          content: typeof resultContent === 'string' ? resultContent : '',
          toolCallId
        })
        break
      }
      default:
        break
    }
  }

  for (const [toolCallId, toolCall] of toolCallsById) {
    attachToolCall(messages, toolCall, toolCallParent.get(toolCallId))
  }

  return {
    threadId,
    runId,
    messages: messages.filter(
      (message) => message.role !== REASONING_ROLE || Boolean(message.content?.length)
    )
  }
}

function attachToolCall(
  messages: ThreadMessage[],
  toolCall: SseToolCall | undefined,
  parentId: string | undefined
) {
  if (!toolCall || !parentId) return
  const parent = messages.find((item) => item.id === parentId)
  if (!parent) return
  parent.toolCalls = parent.toolCalls ?? []
  if (!parent.toolCalls.some((item) => item.id === toolCall.id)) {
    parent.toolCalls.push({
      ...toolCall,
      function: { name: toolCall.name, arguments: toolCall.args }
    })
  }
}

export async function parseCopilotSseResponse(response: Response): Promise<ParsedCopilotSseResult> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream')) return { messages: [] }

  let text: string
  try {
    text = await response.text()
  } catch {
    return { messages: [] }
  }

  return parseCopilotSseThreadMessages(text)
}

export function rewriteRunRequestWithoutDisplayMessages(request: Request, body: RunRequestBody) {
  if (!Array.isArray(body.messages)) return request
  const nextMessages = stripCopilotDisplayMessages(body.messages)
  if (nextMessages.length === body.messages.length) return request

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify({ ...body, messages: nextMessages }),
    signal: request.signal,
    duplex: 'half'
  }
  return new Request(request.url, init)
}
