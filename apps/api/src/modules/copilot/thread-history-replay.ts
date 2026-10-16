import { randomUUID } from 'node:crypto'

import {
  mergeMessageMetadata,
  readZenMessageTiming,
  ZEN_MESSAGE_TIMING_METADATA_KEY
} from '@zen/shared'

import type { ThreadMessage } from './copilot-thread.service.js'

/** 仅在 Copilot connect 请求内部传递，响应发出前不会回给浏览器。 */
export const CONNECT_THREAD_HEADER = 'x-zen-connect-thread'

interface SeenUserTurns {
  ids: Set<string>
  texts: string[]
}

interface ReplayMessage {
  id: string
  role: string
  content?: string
  toolCallId?: string
  metadata?: Record<string, unknown>
  toolCalls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readText(content: unknown): string {
  if (typeof content !== 'string') return ''
  return content.trim()
}

function userTexts(messages: Array<{ role: string; content?: string }>): string[] {
  return messages.flatMap((message) => {
    if (message.role !== 'user') return []
    const text = readText(message.content)
    return text ? [text] : []
  })
}

/** 按出现顺序判断快照是否仍包含已有的用户轮次。 */
export function coversUserTurns(stored: readonly string[], incoming: readonly string[]): boolean {
  let index = 0
  for (const text of stored) {
    const found = incoming.indexOf(text, index)
    if (found < 0) return false
    index = found + 1
  }
  return true
}

function dedupeById(messages: ThreadMessage[]): ThreadMessage[] {
  const indexById = new Map<string, number>()
  const result: ThreadMessage[] = []
  for (const message of messages) {
    if (!message.id) {
      result.push(message)
      continue
    }
    const existing = indexById.get(message.id)
    if (existing === undefined) {
      indexById.set(message.id, result.length)
      result.push(message)
      continue
    }
    const previous = result[existing]
    if (previous) {
      result[existing] = {
        ...previous,
        ...message,
        metadata: mergeMessageMetadata(previous.metadata, message.metadata)
      }
    }
  }
  return result
}

/**
 * 完整快照可以整段替换。缺少已有用户轮次时只合并，避免残缺快照删掉历史。
 */
export function mergeAuthoritativeSnapshot(
  stored: ThreadMessage[],
  incoming: ThreadMessage[]
): ThreadMessage[] {
  if (stored.length === 0) return dedupeById(incoming)

  const incomingIds = new Set(incoming.flatMap((message) => (message.id ? [message.id] : [])))
  const coversIds = stored.every((message) => !message.id || incomingIds.has(message.id))
  const storedTexts = userTexts(stored)
  const coversTurns = storedTexts.length > 0 && coversUserTurns(storedTexts, userTexts(incoming))
  if (coversIds || coversTurns) return dedupeById(preserveMetadata(stored, incoming))

  const incomingById = new Map(
    incoming.flatMap((message) => (message.id ? [[message.id, message] as const] : []))
  )
  const seen = new Set<string>()
  const merged: ThreadMessage[] = []
  for (const message of stored) {
    const incomingMessage = message.id ? incomingById.get(message.id) : undefined
    const next = incomingMessage
      ? {
          ...incomingMessage,
          metadata: mergeMessageMetadata(message.metadata, incomingMessage.metadata)
        }
      : message
    merged.push(next)
    if (message.id) seen.add(message.id)
  }
  for (const message of incoming) {
    if (!message.id || seen.has(message.id)) continue
    merged.push(message)
    seen.add(message.id)
  }
  return merged
}

function preserveMetadata(stored: ThreadMessage[], incoming: ThreadMessage[]): ThreadMessage[] {
  const storedById = new Map(
    stored.flatMap((message) => (message.id ? [[message.id, message] as const] : []))
  )
  return incoming.map((message) => {
    const previous = message.id ? storedById.get(message.id) : undefined
    if (!previous) return message
    return {
      ...message,
      metadata: mergeMessageMetadata(previous.metadata, message.metadata)
    }
  })
}

function withReplayTiming(message: ThreadMessage, replay: ReplayMessage): ReplayMessage {
  const timing = readZenMessageTiming(message.metadata)
  if (!timing) return replay
  return { ...replay, metadata: { [ZEN_MESSAGE_TIMING_METADATA_KEY]: timing } }
}

function toReplayMessage(message: ThreadMessage): ReplayMessage | null {
  const replay = toReplayMessageBody(message)
  return replay ? withReplayTiming(message, replay) : null
}

function toReplayMessageBody(message: ThreadMessage): ReplayMessage | null {
  if (!message.id || !message.role) return null
  if (message.role === 'tool') {
    if (!message.toolCallId) return null
    return {
      id: message.id,
      role: 'tool',
      content: message.content ?? '',
      toolCallId: message.toolCallId
    }
  }
  if (message.role === 'assistant') {
    const toolCalls = (message.toolCalls ?? []).flatMap((toolCall) => {
      if (!toolCall.id) return []
      // AG-UI ToolCallSchema 只认 type + function，缺 type 时客户端会丢掉整段快照。
      const name = toolCall.function?.name || toolCall.name || ''
      const args = toolCall.function?.arguments || toolCall.args || ''
      return [
        {
          id: toolCall.id,
          type: 'function' as const,
          function: { name, arguments: args }
        }
      ]
    })
    return {
      id: message.id,
      role: 'assistant',
      content: message.content ?? '',
      ...(toolCalls.length > 0 ? { toolCalls } : {})
    }
  }
  if (
    message.role === 'user' ||
    message.role === 'system' ||
    message.role === 'reasoning' ||
    message.role === 'developer'
  ) {
    return { id: message.id, role: message.role, content: message.content ?? '' }
  }
  return null
}

/** 空闲重连时用数据库消息生成一条可回放的 AG-UI 快照。 */
export function buildHistoryReplaySse(threadId: string, messages: ThreadMessage[]): string | null {
  const replay = messages.flatMap((message) => {
    const next = toReplayMessage(message)
    return next ? [next] : []
  })
  if (replay.length === 0) return null

  const runId = randomUUID()
  const events = [
    {
      type: 'RUN_STARTED',
      threadId,
      runId,
      input: {
        threadId,
        runId,
        state: {},
        messages: replay,
        tools: [],
        context: [],
        forwardedProps: {}
      }
    },
    { type: 'MESSAGES_SNAPSHOT', messages: replay },
    { type: 'RUN_FINISHED', threadId, runId }
  ]
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('')
}

export async function stampConnectThreadRequest(request: Request): Promise<Request | undefined> {
  let raw: string
  let threadId: string
  try {
    raw = await request.clone().text()
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.threadId !== 'string' || parsed.threadId.length === 0) {
      return undefined
    }
    threadId = parsed.threadId
  } catch {
    return undefined
  }

  const headers = new Headers(request.headers)
  headers.set(CONNECT_THREAD_HEADER, threadId)
  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    body: raw,
    signal: request.signal,
    duplex: 'half'
  }
  return new Request(request.url, init)
}

function rememberUsers(seen: SeenUserTurns, messages: unknown[]): void {
  for (const message of messages) {
    if (!isRecord(message) || message.role !== 'user') continue
    if (typeof message.id === 'string' && message.id.length > 0) seen.ids.add(message.id)
    const text = readText(message.content)
    if (text && !seen.texts.includes(text)) seen.texts.push(text)
  }
}

function snapshotKeepsHistory(messages: unknown[], seen: SeenUserTurns): boolean {
  if (messages.length === 0) return false
  const snapshotIds = new Set(
    messages.flatMap((message) =>
      isRecord(message) && typeof message.id === 'string' ? [message.id] : []
    )
  )
  const missingId = [...seen.ids].some((id) => !snapshotIds.has(id))
  if (!missingId) return true
  return coversUserTurns(
    seen.texts,
    userTexts(
      messages.flatMap((message) => {
        if (!isRecord(message) || typeof message.role !== 'string') return []
        return [
          {
            role: message.role,
            content: typeof message.content === 'string' ? message.content : ''
          }
        ]
      })
    )
  )
}

function filterSseBlock(block: string, seen: SeenUserTurns): string {
  const dataLine = block.split('\n').find((line) => line.trimStart().startsWith('data:'))
  if (!dataLine) return `${block}\n\n`

  let event: unknown
  try {
    event = JSON.parse(dataLine.trimStart().slice('data:'.length).trim())
  } catch {
    return `${block}\n\n`
  }
  if (!isRecord(event) || typeof event.type !== 'string') return `${block}\n\n`

  if (
    event.type === 'RUN_STARTED' &&
    isRecord(event.input) &&
    Array.isArray(event.input.messages)
  ) {
    rememberUsers(seen, event.input.messages)
  }
  if (event.type === 'MESSAGES_SNAPSHOT' && Array.isArray(event.messages)) {
    if (!snapshotKeepsHistory(event.messages, seen)) return ''
    rememberUsers(seen, event.messages)
  }
  return `${block}\n\n`
}

/** 丢掉空快照，以及会抹掉已出现用户轮次的快照。 */
export function filterRegressiveSnapshotStream(
  body: ReadableStream<Uint8Array>,
  preserved: ThreadMessage[] = []
): ReadableStream<Uint8Array> {
  const seen: SeenUserTurns = { ids: new Set<string>(), texts: [] }
  rememberUsers(seen, preserved)
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  const push = (controller: TransformStreamDefaultController<Uint8Array>, blocks: string[]) => {
    const output = blocks.map((block) => filterSseBlock(block, seen)).join('')
    if (output.length > 0) controller.enqueue(encoder.encode(output))
  }

  return body.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        push(
          controller,
          parts.filter((part) => part.length > 0)
        )
      },
      flush(controller) {
        buffer += decoder.decode()
        if (buffer.trim().length === 0) return
        push(controller, [buffer])
      }
    })
  )
}
