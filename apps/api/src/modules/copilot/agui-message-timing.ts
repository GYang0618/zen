import { readZenMessageTiming, withZenMessageTiming } from '@zen/shared'

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

export interface HistoryTimingWriter {
  /** 把已保存或已观察到的起止时间写进这条事件里的消息。 */
  rewrite(event: Record<string, unknown>): void
}

/**
 * 历史回放的事件来自运行时内存时，消息上没有 `zen` 计时。
 * 已保存的计时优先；事件自带时间戳时，用它补上还没落库的这一轮。
 */
export function createHistoryTimingWriter(stored: ThreadMessage[]): HistoryTimingWriter {
  const storedById = storedTimingById(stored)
  const reasoningStarts = new Map<string, number>()
  const reasoningEnds = new Map<string, number>()
  let workStartedAt: number | undefined
  let lastTimestamp: number | undefined

  const timingFor = (id: string, role: string) =>
    resolveHistoryTiming(role, storedById.get(id), {
      reasoningStart: reasoningStarts.get(id),
      reasoningEnd: reasoningEnds.get(id),
      workStartedAt,
      lastTimestamp
    })

  return {
    rewrite(event) {
      noteHistoryTiming(event, {
        reasoningStarts,
        reasoningEnds,
        getWorkStartedAt: () => workStartedAt,
        setWorkStartedAt: (value) => {
          workStartedAt = value
        },
        setLastTimestamp: (value) => {
          lastTimestamp = value
        }
      })
      stampEventMessageList(event, timingFor)
      stampReasoningEndMetadata(event, timingFor)
    }
  }
}

interface HistoryTimingNote {
  reasoningStarts: Map<string, number>
  reasoningEnds: Map<string, number>
  getWorkStartedAt: () => number | undefined
  setWorkStartedAt: (value: number) => void
  setLastTimestamp: (value: number) => void
}

function noteHistoryTiming(event: Record<string, unknown>, note: HistoryTimingNote) {
  const timestamp = readEventTimestamp(event)
  if (timestamp === undefined) return
  note.setLastTimestamp(timestamp)
  const type = typeof event.type === 'string' ? event.type : ''
  if (WORK_START_TYPES.has(type) && note.getWorkStartedAt() === undefined) {
    note.setWorkStartedAt(timestamp)
  }
  const messageId = readMessageId(event)
  if (!messageId) return
  if (REASONING_START_TYPES.has(type) && !note.reasoningStarts.has(messageId)) {
    note.reasoningStarts.set(messageId, timestamp)
  }
  if (REASONING_END_TYPES.has(type)) note.reasoningEnds.set(messageId, timestamp)
}

function resolveHistoryTiming(
  role: string,
  stored: ZenMessageTiming | undefined,
  observed: {
    reasoningStart: number | undefined
    reasoningEnd: number | undefined
    workStartedAt: number | undefined
    lastTimestamp: number | undefined
  }
): ZenMessageTiming | undefined {
  if (role === 'reasoning') {
    return mergeTiming(reasoningSpan(observed.reasoningStart, observed.reasoningEnd), stored)
  }
  if (role !== 'user') return stored
  return mergeTiming(workSpan(observed.workStartedAt, observed.lastTimestamp), stored)
}

function reasoningSpan(
  startedAt: number | undefined,
  endedAt: number | undefined
): ZenMessageTiming | undefined {
  if (startedAt === undefined || endedAt === undefined || endedAt < startedAt) return undefined
  return { startedAt, endedAt }
}

function workSpan(
  startedAt: number | undefined,
  endedAt: number | undefined
): ZenMessageTiming | undefined {
  if (startedAt === undefined || endedAt === undefined || endedAt <= startedAt) return undefined
  return { workStartedAt: startedAt, workEndedAt: endedAt }
}

function mergeTiming(
  computed: ZenMessageTiming | undefined,
  stored: ZenMessageTiming | undefined
): ZenMessageTiming | undefined {
  if (!computed) return stored
  if (!stored) return computed
  return { ...computed, ...stored }
}

function storedTimingById(stored: ThreadMessage[]): Map<string, ZenMessageTiming> {
  const timings = new Map<string, ZenMessageTiming>()
  for (const message of stored) {
    if (!message.id) continue
    const timing = readZenMessageTiming(message.metadata)
    if (timing) timings.set(message.id, timing)
  }
  return timings
}

function stampEventMessageList(
  event: Record<string, unknown>,
  timingFor: (id: string, role: string) => ZenMessageTiming | undefined
) {
  const type = typeof event.type === 'string' ? event.type : ''
  if (type === 'MESSAGES_SNAPSHOT' && Array.isArray(event.messages)) {
    stampMessages(event.messages, timingFor)
  }
  if (type !== 'RUN_STARTED' || !isRecord(event.input) || !Array.isArray(event.input.messages)) {
    return
  }
  stampMessages(event.input.messages, timingFor)
}

function stampMessages(
  messages: unknown[],
  timingFor: (id: string, role: string) => ZenMessageTiming | undefined
) {
  for (const message of messages) stampMessage(message, timingFor)
}

function stampMessage(
  message: unknown,
  timingFor: (id: string, role: string) => ZenMessageTiming | undefined
) {
  if (!isRecord(message)) return
  const id = typeof message.id === 'string' ? message.id : undefined
  const role = typeof message.role === 'string' ? message.role : undefined
  if (!id || !role) return
  const timing = timingFor(id, role)
  if (!timing) return
  const metadata = isRecord(message.metadata) ? message.metadata : undefined
  message.metadata = withZenMessageTiming(metadata, timing)
}

function stampReasoningEndMetadata(
  event: Record<string, unknown>,
  timingFor: (id: string, role: string) => ZenMessageTiming | undefined
) {
  const type = typeof event.type === 'string' ? event.type : ''
  if (!REASONING_END_TYPES.has(type)) return
  const messageId = readMessageId(event)
  if (!messageId) return
  const timing = timingFor(messageId, 'reasoning')
  if (!timing) return
  const metadata = isRecord(event.metadata) ? event.metadata : undefined
  event.metadata = withZenMessageTiming(metadata, timing)
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
