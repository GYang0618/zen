const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600

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

export function formatWorkDurationTitle(isWorking: boolean, durationSeconds?: number): string {
  if (isWorking) {
    return `工作了 ${formatWorkDurationLive(durationSeconds ?? 0)}`
  }
  if (durationSeconds === undefined) return '工作了片刻'
  return `工作了 ${formatWorkDurationComplete(durationSeconds)}`
}
