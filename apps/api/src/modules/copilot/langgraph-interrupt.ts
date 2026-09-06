import type { RuntimeEvent } from './default-agent-runtime.types.js'

const ON_INTERRUPT_EVENT = 'on_interrupt'
const FALLBACK_INTERRUPT_ID = 'interrupt'
const APPROVAL_REASON = 'approval'

export interface InterruptOutcome {
  type: 'interrupt'
  interrupts: AgUiInterrupt[]
}

export interface AgUiInterrupt {
  id: string
  reason: string
  message?: string
  toolCallId?: string
  expiresAt?: string
  metadata?: Record<string, unknown>
}

export function isGraphInterruptError(error: unknown): boolean {
  if (typeof error === 'string') return isInterruptMessage(error)
  if (!error || typeof error !== 'object') return false
  const record = error as Record<string, unknown>
  const name = String(record.name ?? '')
  const message = String(record.message ?? '')
  return name === 'GraphInterrupt' || isInterruptMessage(message)
}

export function isInterruptRunErrorEvent(event: RuntimeEvent): boolean {
  if (event.type !== 'RUN_ERROR') return false
  return isGraphInterruptError(event) || isGraphInterruptError(event.message)
}

export function isOnInterruptCustomEvent(event: RuntimeEvent): boolean {
  if (String(event.type).toUpperCase() !== 'CUSTOM') return false
  if (event.name === ON_INTERRUPT_EVENT) return true
  const payload = asRecord(parseJsonValue(event.value))
  return Boolean(
    payload && (Array.isArray(payload.actionRequests) || Array.isArray(payload.reviewConfigs))
  )
}

export function extractGraphInterrupts(source: unknown): unknown[] {
  const record = asRecord(source)
  if (!record) return []
  if (Array.isArray(record.interrupts)) return record.interrupts

  const cause = asRecord(record.cause)
  if (cause && Array.isArray(cause.interrupts)) return cause.interrupts

  const rawEvent = asRecord(record.rawEvent)
  if (record.name === ON_INTERRUPT_EVENT || isOnInterruptCustomEvent(record as RuntimeEvent)) {
    if (rawEvent) return [rawEvent]
    const parsed = parseJsonValue(record.value)
    if (Array.isArray(parsed)) return parsed
    return parsed === undefined ? [] : [parsed]
  }

  const value = parseJsonValue(record.value)
  if (Array.isArray(value)) return value
  const payload = asRecord(value)
  if (payload && Array.isArray(payload.actionRequests)) return [payload]
  if (Array.isArray(record.actionRequests)) return [record]
  return [record]
}

export function toAgUiInterrupts(source: unknown): AgUiInterrupt[] {
  const extracted = extractGraphInterrupts(source)
  if (extracted.length === 0) return [normalizeAgUiInterrupt(source, 0)]
  return extracted.map((item, index) => normalizeAgUiInterrupt(item, index))
}

export interface InterruptFinishEvents {
  custom: RuntimeEvent
  finished: RuntimeEvent
  clientFinished: RuntimeEvent
  outcome: InterruptOutcome
}

export function toInterruptFinishEvents(
  input: { threadId: string; runId: string },
  source: unknown,
  options?: { fallbackToolCallId?: string }
): InterruptFinishEvents {
  const interrupts = toAgUiInterrupts(source).map((interrupt) =>
    applyFallbackToolCallId(interrupt, options?.fallbackToolCallId)
  )
  const primary = interrupts[0] ?? { id: `${FALLBACK_INTERRUPT_ID}-0`, reason: APPROVAL_REASON }
  const outcome: InterruptOutcome = { type: 'interrupt', interrupts }
  const threadId = input.threadId
  const runId = input.runId
  return {
    custom: toOnInterruptCustomEvent(primary),
    finished: {
      type: 'RUN_FINISHED',
      threadId,
      runId,
      outcome
    },
    clientFinished: {
      type: 'RUN_FINISHED',
      threadId,
      runId
    },
    outcome
  }
}

export function toOnInterruptCustomEvent(interrupt: AgUiInterrupt): RuntimeEvent {
  const payload = {
    id: interrupt.id,
    ...(asRecord(interrupt.metadata?.value) ?? {}),
    ...(interrupt.metadata?.toolName ? { toolName: interrupt.metadata.toolName } : {}),
    ...(interrupt.metadata?.args !== undefined ? { args: interrupt.metadata.args } : {})
  }
  return {
    type: 'CUSTOM',
    name: ON_INTERRUPT_EVENT,
    value: JSON.stringify(payload),
    rawEvent: { id: interrupt.id, value: payload }
  }
}

function applyFallbackToolCallId(
  interrupt: AgUiInterrupt,
  fallbackToolCallId?: string
): AgUiInterrupt {
  if (!fallbackToolCallId) return interrupt
  const generated = interrupt.id.startsWith(`${FALLBACK_INTERRUPT_ID}-`)
  if (!generated && interrupt.toolCallId) return interrupt
  return {
    ...interrupt,
    id: generated ? fallbackToolCallId : interrupt.id,
    toolCallId: interrupt.toolCallId ?? fallbackToolCallId
  }
}

function normalizeAgUiInterrupt(item: unknown, index: number): AgUiInterrupt {
  const record = asRecord(item) ?? {}
  const payload = asRecord(parseJsonValue(record.value)) ?? record
  const requests = Array.isArray(payload.actionRequests) ? payload.actionRequests : []
  const first = asRecord(requests[0])
  const toolCallId = readString(record.toolCallId) ?? readString(record.id) ?? readString(first?.id)
  const id = toolCallId ?? `${FALLBACK_INTERRUPT_ID}-${index}`
  const toolName = readString(first?.name) ?? readString(payload.toolName) ?? readString(record.ns)
  const description =
    readString(first?.description) ?? readString(payload.description) ?? readString(record.message)

  return {
    id,
    reason: toolName ? `${APPROVAL_REASON}:${toolName}` : APPROVAL_REASON,
    ...(description ? { message: description } : {}),
    ...(toolCallId ? { toolCallId } : {}),
    metadata: {
      ...(toolName ? { toolName } : {}),
      ...(first?.args !== undefined ? { args: first.args } : {}),
      value: payload
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function isInterruptMessage(message: string): boolean {
  return /^interrupt$/i.test(message.trim())
}
