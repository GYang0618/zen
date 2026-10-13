import { withZenMessageTiming } from '@zen/shared'

import type { ZenMessageTiming } from '@zen/shared'
import type { ThreadMessage } from './copilot-thread.service.js'

const REASONING_START_TYPES = new Set(['REASONING_MESSAGE_START', 'THINKING_TEXT_MESSAGE_START'])
const REASONING_END_TYPES = new Set(['REASONING_MESSAGE_END', 'THINKING_TEXT_MESSAGE_END'])
const RUN_END_TYPES = new Set(['RUN_FINISHED', 'RUN_ERROR'])
/** 折叠区出现后 UI 才开始计「工作了」，与这些事件对齐。 */
const WORK_START_TYPES = new Set([
  'REASONING_MESSAGE_START',
  'THINKING_TEXT_MESSAGE_START',
  'TEXT_MESSAGE_START',
  'TOOL_CALL_START',
  'ACTIVITY_SNAPSHOT',
  'ACTIVITY_DELTA'
])

interface MessageTimingRecorder {
  observe(event: Record<string, unknown>): void
  apply(messages: ThreadMessage[]): void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readEventTimestamp(event: Record<string, unknown>): number | undefined {
  return typeof event.timestamp === 'number' && Number.isFinite(event.timestamp)
    ? event.timestamp
    : undefined
}

function readMessageId(event: Record<string, unknown>): string | undefined {
  return typeof event.messageId === 'string' && event.messageId.length > 0
    ? event.messageId
    : undefined
}

/**
 * 从 AG-UI 事件的 `timestamp` 记下思考区间和整轮工作区间。
 * 解析结束后写入对应消息的 metadata。
 */
export function createMessageTimingRecorder(): MessageTimingRecorder {
  let workStartedAt: number | undefined
  let runEndedAt: number | undefined
  let lastTimestamp: number | undefined
  const reasoningStarts = new Map<string, number>()
  const reasoningEnds = new Map<string, number>()

  return {
    observe(event) {
      const timestamp = readEventTimestamp(event)
      if (timestamp === undefined) return
      lastTimestamp = timestamp
      const type = typeof event.type === 'string' ? event.type : ''
      if (WORK_START_TYPES.has(type) && workStartedAt === undefined) workStartedAt = timestamp
      if (RUN_END_TYPES.has(type)) runEndedAt = timestamp
      const messageId = readMessageId(event)
      if (!messageId) return
      if (REASONING_START_TYPES.has(type) && !reasoningStarts.has(messageId)) {
        reasoningStarts.set(messageId, timestamp)
      }
      if (REASONING_END_TYPES.has(type)) reasoningEnds.set(messageId, timestamp)
    },
    apply(messages) {
      applyReasoningTiming(messages, reasoningStarts, reasoningEnds, runEndedAt ?? lastTimestamp)
      applyWorkTiming(messages, workStartedAt, runEndedAt ?? lastTimestamp)
    }
  }
}

function applyReasoningTiming(
  messages: ThreadMessage[],
  starts: Map<string, number>,
  ends: Map<string, number>,
  fallbackEnd: number | undefined
) {
  for (const message of messages) {
    if (message.role !== 'reasoning') continue
    const startedAt = starts.get(message.id)
    const endedAt = ends.get(message.id) ?? fallbackEnd
    if (startedAt === undefined || endedAt === undefined || endedAt < startedAt) continue
    writeTiming(message, { startedAt, endedAt })
  }
}

function applyWorkTiming(
  messages: ThreadMessage[],
  startedAt: number | undefined,
  endedAt: number | undefined
) {
  if (startedAt === undefined || endedAt === undefined || endedAt < startedAt) return
  const user = messages.findLast((message) => message.role === 'user')
  if (!user) return
  writeTiming(user, { workStartedAt: startedAt, workEndedAt: endedAt })
}

function writeTiming(message: ThreadMessage, timing: ZenMessageTiming) {
  message.metadata = withZenMessageTiming(message.metadata, timing)
}

function stampSseBlock(block: string, now: number): string {
  let changed = false
  const lines = block.split('\n').map((line) => {
    const trimmed = line.trimStart()
    if (!trimmed.startsWith('data:')) return line
    const raw = trimmed.slice('data:'.length).trim()
    if (!raw || raw === '[DONE]') return line
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!isRecord(parsed) || typeof parsed.timestamp === 'number') return line
      parsed.timestamp = now
      changed = true
      const prefix = line.slice(0, line.indexOf('data:'))
      return `${prefix}data: ${JSON.stringify(parsed)}`
    } catch {
      return line
    }
  })
  return changed ? lines.join('\n') : block
}

/** 事件到达时补上缺失的 AG-UI `timestamp`，已有时间戳保持原值。 */
export function stampMissingEventTimestamps(response: Response): Response {
  if (!response.body) return response
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(stampStream(response.body), { status: response.status, headers })
}

function stampStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  const push = (controller: TransformStreamDefaultController<Uint8Array>, blocks: string[]) => {
    const now = Date.now()
    const output = blocks.map((block) => `${stampSseBlock(block, now)}\n\n`).join('')
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
