import { z } from 'zod'

/**
 * AG-UI 保留 `ag-ui` 这个 metadata 键。
 * 回合用时放在应用自己的键下，随消息 metadata 进入 MESSAGES_SNAPSHOT。
 */
export const ZEN_MESSAGE_TIMING_METADATA_KEY = 'zen'

/** 毫秒时间戳，对应 AG-UI 事件的 `timestamp`。 */
export const zenMessageTimingSchema = z.object({
  startedAt: z.number().finite().optional(),
  endedAt: z.number().finite().optional(),
  workStartedAt: z.number().finite().optional(),
  workEndedAt: z.number().finite().optional()
})

export type ZenMessageTiming = z.infer<typeof zenMessageTimingSchema>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readZenMessageTiming(metadata: unknown): ZenMessageTiming | undefined {
  if (!isRecord(metadata)) return undefined
  const parsed = zenMessageTimingSchema.safeParse(metadata[ZEN_MESSAGE_TIMING_METADATA_KEY])
  if (!parsed.success) return undefined
  return Object.keys(parsed.data).length > 0 ? parsed.data : undefined
}

/** 按 AG-UI 规则浅合并 metadata：同名键以后写入的为准，不递归合并。 */
export function mergeMessageMetadata(
  previous: unknown,
  next: unknown
): Record<string, unknown> | undefined {
  if (!isRecord(previous)) return isRecord(next) ? next : undefined
  if (!isRecord(next)) return previous
  return { ...previous, ...next }
}

export function withZenMessageTiming(
  metadata: Record<string, unknown> | undefined,
  timing: ZenMessageTiming
): Record<string, unknown> {
  const current = readZenMessageTiming(metadata) ?? {}
  return {
    ...metadata,
    [ZEN_MESSAGE_TIMING_METADATA_KEY]: { ...current, ...timing }
  }
}
