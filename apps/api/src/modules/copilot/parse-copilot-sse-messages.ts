import { mergeMessageMetadata, stripCopilotDisplayMessages } from '@zen/shared'

import { createMessageTimingRecorder } from './agui-message-timing.js'
import { restoreDisplacedTurnPrefix } from './thread-message-order.js'

import type { CopilotDisplayMessageRole } from '@zen/shared'
import type { ThreadMessage } from './copilot-thread.service.js'

const REASONING_ROLE: CopilotDisplayMessageRole = 'reasoning'
const ACTIVITY_ROLE: CopilotDisplayMessageRole = 'activity'

interface SseToolCall {
  id: string
  type: 'function'
  name: string
  args: string
}

export interface ParsedCopilotSseResult {
  messages: ThreadMessage[]
  threadId?: string
  runId?: string
  /** 为 true 时消息来自非空 MESSAGES_SNAPSHOT，可以整段覆盖会话。 */
  authoritative: boolean
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

function readMessageContent(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return undefined
  const text = value
    .flatMap((part) => {
      if (typeof part === 'string') return [part]
      if (!isRecord(part) || typeof part.text !== 'string') return []
      return [part.text]
    })
    .join('\n')
  return text.length > 0 ? text : undefined
}

function isPreservedLocal(
  message: ThreadMessage,
  snapshotHasReasoning: boolean,
  snapshotHasActivity: boolean
) {
  return (
    (message.role === ACTIVITY_ROLE && !snapshotHasActivity) ||
    (message.role === REASONING_ROLE && !snapshotHasReasoning)
  )
}

function mergeSnapshotMessage(
  snapshotMessage: ThreadMessage,
  current: ThreadMessage | undefined
): ThreadMessage {
  if (!current) return snapshotMessage
  const snapshotContent = snapshotMessage.content ?? ''
  const currentContent = current.content ?? ''
  return {
    ...current,
    ...snapshotMessage,
    content:
      snapshotContent.length >= currentContent.length ? snapshotMessage.content : current.content,
    toolCalls: snapshotMessage.toolCalls ?? current.toolCalls,
    toolCallId: snapshotMessage.toolCallId ?? current.toolCallId,
    metadata: mergeMessageMetadata(current.metadata, snapshotMessage.metadata)
  }
}

function anchorLocalMessages(
  current: ThreadMessage[],
  snapshotById: Map<string, ThreadMessage>,
  snapshotHasReasoning: boolean,
  snapshotHasActivity: boolean
) {
  const localsByAnchor = new Map<string, ThreadMessage[]>()
  let lastSnapshotId = ''

  for (const message of current) {
    if (snapshotById.has(message.id)) {
      lastSnapshotId = message.id
      continue
    }
    if (!isPreservedLocal(message, snapshotHasReasoning, snapshotHasActivity)) continue
    const bucket = localsByAnchor.get(lastSnapshotId) ?? []
    bucket.push(message)
    localsByAnchor.set(lastSnapshotId, bucket)
  }

  return localsByAnchor
}

/**
 * 检查点快照是消息顺序的事实来源。流式阶段先出现的 assistant 不能把
 * 快照里才出现的 user 挤到末尾；快照没有的 reasoning / activity 仍插回原位置。
 */
function applyMessagesSnapshot(
  current: ThreadMessage[],
  snapshot: ThreadMessage[]
): ThreadMessage[] {
  const snapshotById = new Map(snapshot.map((message) => [message.id, message]))
  const currentById = new Map(current.map((message) => [message.id, message]))
  const localsByAnchor = anchorLocalMessages(
    current,
    snapshotById,
    snapshot.some((message) => message.role === REASONING_ROLE),
    snapshot.some((message) => message.role === ACTIVITY_ROLE)
  )

  const next = [...(localsByAnchor.get('') ?? [])]
  for (const message of snapshot) {
    next.push(mergeSnapshotMessage(message, currentById.get(message.id)))
    next.push(...(localsByAnchor.get(message.id) ?? []))
  }
  return next
}

function normalizeSnapshotMessage(raw: unknown): ThreadMessage | null {
  if (!isRecord(raw)) return null
  const id = readString(raw.id)
  const role = readString(raw.role)
  if (!id || !role) return null

  const message: ThreadMessage = { id, role }
  const content = readMessageContent(raw.content)
  if (content !== undefined) message.content = content
  if (typeof raw.toolCallId === 'string') {
    message.toolCallId = raw.toolCallId
  }
  if (isRecord(raw.metadata)) message.metadata = raw.metadata
  if (Array.isArray(raw.toolCalls)) {
    const toolCalls = raw.toolCalls.flatMap((item) => {
      if (!isRecord(item)) return []
      const toolId = readString(item.id)
      if (!toolId) return []
      const fn = isRecord(item.function) ? item.function : undefined
      const name = readString(item.name) ?? readString(fn?.name)
      const args = readString(item.args) ?? readString(fn?.arguments)
      const functionName = readString(fn?.name) ?? name ?? ''
      const functionArgs = readString(fn?.arguments) ?? args ?? ''
      return [
        {
          id: toolId,
          type: 'function' as const,
          name: functionName,
          args: functionArgs,
          function: { name: functionName, arguments: functionArgs }
        }
      ]
    })
    if (toolCalls.length > 0) message.toolCalls = toolCalls
  }
  return message
}

function ingestRunInputMessages(messages: ThreadMessage[], input: unknown) {
  if (!isRecord(input) || !Array.isArray(input.messages)) return
  for (const raw of input.messages) {
    const message = normalizeSnapshotMessage(raw)
    if (message) upsertMessage(messages, message)
  }
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
 * 从 AG-UI SSE 重建会话消息。非空 MESSAGES_SNAPSHOT 以检查点顺序为准，
 * 快照里没有的 reasoning 按流式出现位置插回。
 */
export function parseCopilotSseThreadMessages(text: string): ParsedCopilotSseResult {
  if (!text.trim()) return { messages: [], authoritative: false }

  let threadId: string | undefined
  let runId: string | undefined
  let authoritative = false
  const timing = createMessageTimingRecorder()
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

    timing.observe(event)
    const type = readString(event.type)
    switch (type) {
      case 'RUN_STARTED':
        threadId = readString(event.threadId) ?? threadId
        runId = readString(event.runId) ?? runId
        ingestRunInputMessages(messages, event.input)
        break
      case 'MESSAGES_SNAPSHOT': {
        if (!Array.isArray(event.messages)) break
        const snapshot = event.messages
          .map((item) => normalizeSnapshotMessage(item))
          .filter((item): item is ThreadMessage => item !== null)
        if (snapshot.length === 0) break
        const merged = applyMessagesSnapshot(messages, snapshot)
        messages.splice(0, messages.length, ...merged)
        authoritative = true
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
          type: 'function' as const,
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
  timing.apply(messages)

  return {
    threadId,
    runId,
    authoritative,
    messages: restoreDisplacedTurnPrefix(
      messages.filter(
        (message) => message.role !== REASONING_ROLE || Boolean(message.content?.length)
      )
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
      type: 'function',
      function: { name: toolCall.name, arguments: toolCall.args }
    })
  }
}

export async function parseCopilotSseResponse(response: Response): Promise<ParsedCopilotSseResult> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream')) return { messages: [], authoritative: false }

  let text: string
  try {
    text = await response.text()
  } catch {
    return { messages: [], authoritative: false }
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
