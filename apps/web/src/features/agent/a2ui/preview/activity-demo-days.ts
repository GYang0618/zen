import type { ActivityDay } from '../components/activity-calendar'

/** 预览沙箱用的确定性活动日，从 2026-01-05（周一）起连续 26 周。 */
export function buildDemoActivityDays(): ActivityDay[] {
  const start = new Date(2026, 0, 5)
  const days: ActivityDay[] = []
  for (let index = 0; index < 26 * 7; index += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const count = (index * 17 + 3) % 11
    const level = (count > 8 ? 4 : count > 5 ? 3 : count > 2 ? 2 : count > 0 ? 1 : 0) as
      | 0
      | 1
      | 2
      | 3
      | 4
    days.push({
      date: key,
      count,
      level,
      tooltip: `${key}：${count} 次`
    })
  }
  return days
}
