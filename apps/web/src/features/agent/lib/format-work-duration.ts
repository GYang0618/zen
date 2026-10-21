const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600

/** 用事件起止时间还原已结束的秒数。进行中的计时不走这里。 */
export function elapsedDurationSeconds(
  startedAt: number | undefined,
  endedAt: number | undefined,
  round: 'ceil' | 'floor'
): number | undefined {
  if (startedAt === undefined || endedAt === undefined) return undefined
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt < startedAt) {
    return undefined
  }
  const raw = (endedAt - startedAt) / MS_PER_SECOND
  const rounded = round === 'ceil' ? Math.ceil(raw) : Math.floor(raw)
  return Math.max(1, rounded)
}

/**
 * 时、分、秒一起走表：10s / 1m 0s / 1h 20min 39s。
 * 出现更高单位时，低位为 0 也保留，避免跨过整分、整时时秒数从标题上消失。
 */
export function formatWorkDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / SECONDS_PER_HOUR)
  const minutes = Math.floor((safe % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const seconds = safe % SECONDS_PER_MINUTE
  if (hours > 0) return `${hours}h ${minutes}min ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export const WORK_WAITING_TITLE = '容我掂量一下'

export type WorkStatus = 'waiting' | 'working' | 'done'

/** 用户消息上的工作区间优先；没有时用这一轮各步骤的起止时间拼出来。 */
export function resolveTurnWorkWindow(
  userTiming: { workStartedAt?: number; workEndedAt?: number } | undefined,
  steps: Array<{ startedAt?: number; endedAt?: number } | undefined>
): { startedAt: number; endedAt: number } | undefined {
  if (
    userTiming?.workStartedAt !== undefined &&
    userTiming.workEndedAt !== undefined &&
    userTiming.workEndedAt >= userTiming.workStartedAt
  ) {
    return { startedAt: userTiming.workStartedAt, endedAt: userTiming.workEndedAt }
  }

  let startedAt: number | undefined
  let endedAt: number | undefined
  for (const step of steps) {
    if (
      step?.startedAt === undefined ||
      step.endedAt === undefined ||
      step.endedAt < step.startedAt
    ) {
      continue
    }
    startedAt = startedAt === undefined ? step.startedAt : Math.min(startedAt, step.startedAt)
    endedAt = endedAt === undefined ? step.endedAt : Math.max(endedAt, step.endedAt)
  }
  if (startedAt === undefined || endedAt === undefined) return undefined
  return { startedAt, endedAt }
}

export function formatWorkStatusTitle(status: WorkStatus, durationSeconds?: number): string {
  if (status === 'waiting') return WORK_WAITING_TITLE
  return formatWorkDurationTitle(status === 'working', durationSeconds)
}

export function formatWorkDurationTitle(isWorking: boolean, durationSeconds?: number): string {
  if (isWorking) return `工作了 ${formatWorkDuration(durationSeconds ?? 0)}`
  if (durationSeconds === undefined) return '工作了片刻'
  return `工作了 ${formatWorkDuration(durationSeconds)}`
}
