import { createHash } from 'node:crypto'

import type { Prisma } from '@prisma/client'
import type { RuntimeEvent } from './default-agent-runtime.types'

export type JsonRecord = Record<string, unknown>

export interface NormalizedMessage {
  id: string
  role: string
  content: string
  toolCallId?: string
  metadata?: JsonRecord
}

const MODEL_MESSAGE_ROLES = new Set(['system', 'user', 'assistant', 'tool'])
const DISPLAY_MESSAGE_ROLES = new Set([...MODEL_MESSAGE_ROLES, 'reasoning'])

/** Checkpoint / 回传模型：不含 reasoning 等仅展示消息。 */
export function normalizeRuntimeMessages(input: unknown[] | undefined): NormalizedMessage[] {
  return normalizeMessages(input, MODEL_MESSAGE_ROLES)
}

/** 会话历史展示：保留 reasoning，仍排除 activity。 */
export function normalizeDisplayMessages(input: unknown[] | undefined): NormalizedMessage[] {
  return normalizeMessages(input, DISPLAY_MESSAGE_ROLES)
}

function normalizeMessages(
  input: unknown[] | undefined,
  allowedRoles: ReadonlySet<string>
): NormalizedMessage[] {
  if (!input) return []
  return input.flatMap((value, index) => {
    const message = asRecord(value)
    const role = typeof message?.role === 'string' ? message.role : ''
    if (!message || !allowedRoles.has(role)) return []
    return [
      {
        id: typeof message.id === 'string' ? message.id : `message-${index}`,
        role,
        content: normalizeContent(message.content),
        toolCallId: typeof message.toolCallId === 'string' ? message.toolCallId : undefined,
        metadata: message.toolCalls ? { toolCalls: message.toolCalls } : undefined
      }
    ]
  })
}

function normalizeContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return content == null ? '' : JSON.stringify(content)
  return content
    .map((part) => {
      const record = asRecord(part)
      return record?.type === 'text' && typeof record.text === 'string' ? record.text : ''
    })
    .filter(Boolean)
    .join('\n')
}

export function turnIdFor(runId: string) {
  return `${runId}:turn:0`
}

export function asRecord(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined
}

export function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value ?? null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function parseRecord(value: unknown): JsonRecord | undefined {
  return asRecord(parseJson(value))
}

export function omitRawEvent(event: RuntimeEvent): RuntimeEvent {
  const { rawEvent: _rawEvent, ...persistedEvent } = event
  return persistedEvent
}

export function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue
}

export function serializeError(error: unknown): Prisma.InputJsonValue {
  if (error instanceof Error) return toJson({ name: error.name, message: error.message })
  return toJson({ message: String(error) })
}

export function hashJson(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value ?? null))
    .digest('hex')
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

const THREAD_CURSOR_SEPARATOR = '::'

export function encodeThreadCursor(thread: { id: string; updatedAt: Date | string }): string {
  const updatedAt =
    thread.updatedAt instanceof Date
      ? thread.updatedAt.toISOString()
      : new Date(thread.updatedAt).toISOString()
  return `${updatedAt}${THREAD_CURSOR_SEPARATOR}${thread.id}`
}

export function decodeThreadCursor(cursor: string): { id: string; updatedAt: Date } | undefined {
  const separatorIndex = cursor.indexOf(THREAD_CURSOR_SEPARATOR)
  if (separatorIndex <= 0) return undefined
  const updatedAt = new Date(cursor.slice(0, separatorIndex))
  const id = cursor.slice(separatorIndex + THREAD_CURSOR_SEPARATOR.length).trim()
  if (!id || Number.isNaN(updatedAt.getTime())) return undefined
  return { id, updatedAt }
}

export function findTokenUsage(
  value: unknown,
  depth = 0
): { inputTokens: number; outputTokens: number } {
  if (depth > 4 || value === null || typeof value !== 'object') {
    return { inputTokens: 0, outputTokens: 0 }
  }
  const record = value as JsonRecord
  const usage =
    asRecord(record.usage) ?? asRecord(record.usage_metadata) ?? asRecord(record.tokenUsage)
  if (usage) {
    return {
      inputTokens: numberValue(usage.input_tokens ?? usage.promptTokens ?? usage.prompt_tokens),
      outputTokens: numberValue(
        usage.output_tokens ?? usage.completionTokens ?? usage.completion_tokens
      )
    }
  }
  for (const child of Object.values(record)) {
    const found = findTokenUsage(child, depth + 1)
    if (found.inputTokens || found.outputTokens) return found
  }
  return { inputTokens: 0, outputTokens: 0 }
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0
}

export function percentile(values: number[], ratio: number): number | null {
  if (!values.length) return null
  return values[Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1)] ?? null
}
