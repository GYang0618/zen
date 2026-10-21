export interface LabeledCount {
  label: string
  value: number
}

export interface LabeledShare extends LabeledCount {
  percentage: number
}

export type ActivityLevel = 0 | 1 | 2 | 3 | 4

export type HeatmapIntensity = 'none' | 'low' | 'medium' | 'high'

/** 部分占整体的比例，保留 4 位小数。整体为 0 时返回 0。 */
export function ratio(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Number((part / whole).toFixed(4))
}

/** 为构成项补上占本组合计的百分比（0-100，一位小数）。 */
export function withShare(items: LabeledCount[]): LabeledShare[] {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return items.map((item) => ({
    ...item,
    percentage: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0
  }))
}

/** 服务器本地日历日。避免 toISOString 在东八区把当天切到前一天。 */
export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function eachLocalDate(start: Date, dayCount: number): string[] {
  const keys: string[] = []
  for (let index = 0; index < dayCount; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    keys.push(localDateKey(date))
  }
  return keys
}

/** 按正数分位把计数映射到 0-4。全 0 为 0；相同正数同级，避免把每一天都标成峰值。 */
export function activityLevels(counts: number[]): ActivityLevel[] {
  const positive = counts.filter((count) => count > 0).sort((left, right) => left - right)
  if (positive.length === 0) return counts.map(() => 0)

  const quantile = (position: number) =>
    positive[Math.min(positive.length - 1, Math.floor(position * (positive.length - 1)))] ?? 0
  const lower = quantile(0.25)
  const middle = quantile(0.5)
  const upper = quantile(0.75)

  return counts.map((count) => {
    if (count <= 0) return 0
    if (count <= lower) return 1
    if (count <= middle) return 2
    if (count <= upper) return 3
    return 4
  })
}

export function heatmapIntensity(value: number, max: number): HeatmapIntensity {
  if (value <= 0 || max <= 0) return 'none'
  const share = value / max
  if (share >= 0.66) return 'high'
  if (share >= 0.33) return 'medium'
  return 'low'
}
