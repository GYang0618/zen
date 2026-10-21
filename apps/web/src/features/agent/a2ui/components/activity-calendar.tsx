import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@zen/ui'
import { useMemo } from 'react'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface ActivityDay {
  date: string
  count?: number
  level?: 0 | 1 | 2 | 3 | 4
  tooltip?: string
}

export interface ActivityCalendarProps {
  title: string
  subtitle?: string
  months?: string[]
  days?: ActivityDay[]
  footer?: string
  className?: string
}

const WEEKDAY_LABELS = ['周一', '', '周三', '', '周五', '', ''] as const

const LEVEL_CLASSES: Record<number, string> = {
  0: 'bg-muted/40 dark:bg-muted/40 hover:ring-1 hover:ring-border',
  1: 'bg-muted-foreground/25 dark:bg-muted-foreground/30 hover:opacity-80',
  2: 'bg-muted-foreground/50 dark:bg-muted-foreground/55 hover:opacity-80',
  3: 'bg-muted-foreground/80 dark:bg-muted-foreground/80 hover:opacity-80',
  4: 'bg-foreground dark:bg-foreground hover:opacity-80'
}

export function ActivityCalendar({ props }: RendererProps<ActivityCalendarProps>) {
  const { title, subtitle, months, days = [], footer, className } = props
  const calendarData = useMemo(() => alignActivityDays(days), [days])
  const monthLabels = months && months.length > 0 ? months : deriveMonthLabels(calendarData)

  // 按周将天分组 (列优先：每列 7 天，共 N 周)
  const weeks = useMemo(() => {
    const list: ActivityDay[][] = []
    for (let i = 0; i < calendarData.length; i += 7) {
      list.push(calendarData.slice(i, i + 7))
    }
    return list
  }, [calendarData])

  return (
    <TooltipProvider delay={100}>
      <Card className={cn('@container/chart h-full w-full', className)}>
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </CardHeader>

        <CardContent className="space-y-3">
          {calendarData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无每日活动数据</p>
          ) : (
            <>
              <div className="overflow-x-auto pb-1">
                <div className="min-w-[500px] space-y-1.5">
                  <div className="flex items-center pl-10 text-xs font-medium text-muted-foreground">
                    {monthLabels.map((m) => (
                      <div key={m} className="flex-1 text-left font-mono">
                        {m}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex w-8 shrink-0 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                      {WEEKDAY_LABELS.map((label, index) => (
                        <span
                          key={label || `weekday-${index}`}
                          className="flex h-2.5 items-center leading-none @sm/chart:h-3"
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* 26 列矩阵 (每列 7 天圆点) */}
                    <div className="flex flex-1 items-center justify-between gap-1">
                      {weeks.map((week, wIdx) => (
                        <div key={`week-${wIdx}`} className="flex flex-col gap-1.5">
                          {week.map((day, dIdx) => {
                            const lvl = day.level ?? 0
                            const dotNode = (
                              <div
                                tabIndex={0}
                                role="button"
                                aria-label={day.tooltip || day.date}
                                className={cn(
                                  'size-2.5 rounded-full transition-transform hover:scale-125 focus-visible:outline-hidden @sm/chart:size-3',
                                  LEVEL_CLASSES[lvl]
                                )}
                              />
                            )

                            return (
                              <Tooltip key={day.date || `day-${wIdx}-${dIdx}`}>
                                <TooltipTrigger render={dotNode} />
                                <TooltipContent
                                  side="top"
                                  className="rounded-md bg-foreground px-2.5 py-1 text-xs text-background shadow-md"
                                >
                                  <span>{day.tooltip || day.date}</span>
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <span>少</span>
                <span className={cn('size-2 rounded-full', LEVEL_CLASSES[0])} />
                <span className={cn('size-2 rounded-full', LEVEL_CLASSES[1])} />
                <span className={cn('size-2 rounded-full', LEVEL_CLASSES[2])} />
                <span className={cn('size-2 rounded-full', LEVEL_CLASSES[3])} />
                <span className={cn('size-2 rounded-full', LEVEL_CLASSES[4])} />
                <span>多</span>
              </div>
            </>
          )}

          {/* 底部标注说明 */}
          {footer && (
            <p className="border-t border-border/40 pt-2.5 text-xs text-muted-foreground leading-relaxed">
              {footer}
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

function parseCalendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function formatCalendarDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 按周一到周日对齐，并补上区间内缺失的日期，避免星期标签和圆点错位。 */
function alignActivityDays(days: ActivityDay[]): ActivityDay[] {
  const parsed = days
    .map((day) => ({ day, date: parseCalendarDate(day.date) }))
    .filter((item): item is { day: ActivityDay; date: Date } => item.date !== null)
    .sort((left, right) => left.date.getTime() - right.date.getTime())
  if (parsed.length === 0) return []

  const byDate = new Map(parsed.map((item) => [formatCalendarDate(item.date), item.day]))
  const first = new Date(parsed[0]?.date ?? 0)
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  const last = new Date(parsed[parsed.length - 1]?.date ?? first)
  last.setDate(last.getDate() + ((7 - last.getDay()) % 7))

  const aligned: ActivityDay[] = []
  for (let cursor = new Date(first); cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
    const date = formatCalendarDate(cursor)
    aligned.push(byDate.get(date) ?? { date, count: 0, level: 0, tooltip: `${date}：无记录` })
  }
  return aligned
}

function deriveMonthLabels(days: ActivityDay[]): string[] {
  const labels: string[] = []
  const seen = new Set<string>()
  for (const day of days) {
    const date = parseCalendarDate(day.date)
    if (!date) continue
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (seen.has(key)) continue
    seen.add(key)
    labels.push(`${date.getMonth() + 1}月`)
  }
  return labels
}
