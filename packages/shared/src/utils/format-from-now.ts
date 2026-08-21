const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR
const MS_PER_WEEK = 7 * MS_PER_DAY
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

function padTimePart(value: number) {
  return String(value).padStart(2, '0')
}

function formatAbsoluteDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function formatAbsoluteDateTime(date: Date): string {
  return `${formatAbsoluteDate(date)} ${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}`
}

function parseTimestamp(value: string): { date: Date; dateOnly: boolean } | null {
  const trimmed = value.trim()
  const dateOnly = DATE_ONLY_RE.test(trimmed)
  const date = dateOnly ? new Date(`${trimmed}T00:00:00`) : new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return { date, dateOnly }
}

/**
 * 7 天内用相对时间（前 / 后），满 7 天及以上显示「2026年9月30日 10:20」。
 * 仅日期（YYYY-MM-DD）在超过 7 天时不带时分。
 */
export function formatFromNow(value: string | null | undefined, now = Date.now()): string {
  if (!value) return '—'
  const parsed = parseTimestamp(value)
  if (!parsed) return value

  const { date, dateOnly } = parsed
  const delta = date.getTime() - now
  const abs = Math.abs(delta)
  if (abs >= MS_PER_WEEK) {
    return dateOnly ? formatAbsoluteDate(date) : formatAbsoluteDateTime(date)
  }

  const suffix = delta > 0 ? '后' : '前'
  if (abs < MS_PER_MINUTE) return `${Math.max(1, Math.floor(abs / MS_PER_SECOND))}s${suffix}`
  if (abs < MS_PER_HOUR) return `${Math.floor(abs / MS_PER_MINUTE)}分钟${suffix}`
  if (abs < MS_PER_DAY) return `${Math.floor(abs / MS_PER_HOUR)}小时${suffix}`
  return `${Math.floor(abs / MS_PER_DAY)}天${suffix}`
}
