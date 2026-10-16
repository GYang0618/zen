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

/** 进行中：按最大单位显示，如 12s / 3m / 1h。 */
export function formatWorkDurationLive(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  if (safe < SECONDS_PER_MINUTE) return `${safe}s`
  if (safe < SECONDS_PER_HOUR) return `${Math.floor(safe / SECONDS_PER_MINUTE)}m`
  return `${Math.floor(safe / SECONDS_PER_HOUR)}h`
}

/** 完成后：组合单位，如 45s / 2m 15s / 1h 2m 3s。 */
export function formatWorkDurationComplete(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / SECONDS_PER_HOUR)
  const minutes = Math.floor((safe % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const seconds = safe % SECONDS_PER_MINUTE
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)
  return parts.join(' ')
}

export const WORK_WAITING_TITLE = '容我掂量一下'

export type WorkStatus = 'waiting' | 'working' | 'done'

export function formatWorkStatusTitle(status: WorkStatus, durationSeconds?: number): string {
  if (status === 'waiting') return WORK_WAITING_TITLE
  return formatWorkDurationTitle(status === 'working', durationSeconds)
}

export function formatWorkDurationTitle(isWorking: boolean, durationSeconds?: number): string {
  if (isWorking) {
    return `工作了 ${formatWorkDurationLive(durationSeconds ?? 0)}`
  }
  if (durationSeconds === undefined) return '工作了片刻'
  return `工作了 ${formatWorkDurationComplete(durationSeconds)}`
}
