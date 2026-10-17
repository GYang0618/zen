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

const LEVEL_CLASSES: Record<number, string> = {
  0: 'bg-muted/40 dark:bg-muted/40 hover:ring-1 hover:ring-border',
  1: 'bg-muted-foreground/25 dark:bg-muted-foreground/30 hover:opacity-80',
  2: 'bg-muted-foreground/50 dark:bg-muted-foreground/55 hover:opacity-80',
  3: 'bg-muted-foreground/80 dark:bg-muted-foreground/80 hover:opacity-80',
  4: 'bg-foreground dark:bg-foreground hover:opacity-80'
}

const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

export function ActivityCalendar({ props }: RendererProps<ActivityCalendarProps>) {
  const { title, subtitle, months = DEFAULT_MONTHS, days = [], footer, className } = props

  // 如果没有传入具体 days 数据，自动生成 26 周 × 7 天的示例日历数据
  const calendarData = useMemo(() => {
    if (days && days.length > 0) return days

    // 默认生成 26 周 (约半年)
    const result: ActivityDay[] = []
    const baseDate = new Date(2026, 0, 1) // 2026-01-01

    for (let i = 0; i < 26 * 7; i++) {
      const d = new Date(baseDate)
      d.setDate(baseDate.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)

      // 演示强度分布：部分暗色高峰（如 4月中旬）
      let level: 0 | 1 | 2 | 3 | 4 = 0
      const isPeak = dateStr === '2026-04-14'
      if (isPeak) {
        level = 4
      } else {
        const rand = (i * 37 + 13) % 100
        if (rand > 85) level = 4
        else if (rand > 65) level = 3
        else if (rand > 40) level = 2
        else if (rand > 20) level = 1
        else level = 0
      }

      result.push({
        date: dateStr,
        level,
        tooltip: `${dateStr}: ${level === 4 ? 'High activity (Peak)' : `Activity level ${level}`}`
      })
    }
    return result
  }, [days])

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
      <Card className={cn('h-full w-full', className)}>
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 日历网格容器 */}
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[500px] space-y-1.5">
              {/* 月份标题栏 (Jan ~ Jun) */}
              <div className="flex items-center pl-8 text-xs font-medium text-muted-foreground">
                {months.map((m) => (
                  <div key={m} className="flex-1 text-left font-mono">
                    {m}
                  </div>
                ))}
              </div>

              {/* 日期行 (星期一至日) 与 圆点矩阵 */}
              <div className="flex gap-2">
                {/* 星期标签列 */}
                <div className="flex w-6 shrink-0 flex-col justify-between py-0.5 text-[10px] font-medium text-muted-foreground">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
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
                              'size-2.5 sm:size-3 rounded-full transition-transform hover:scale-125 focus-visible:outline-hidden',
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

          {/* 底部图例 (Less ● ● ● ● More) */}
          <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <span>Less</span>
            <span className={cn('size-2 rounded-full', LEVEL_CLASSES[0])} />
            <span className={cn('size-2 rounded-full', LEVEL_CLASSES[1])} />
            <span className={cn('size-2 rounded-full', LEVEL_CLASSES[2])} />
            <span className={cn('size-2 rounded-full', LEVEL_CLASSES[3])} />
            <span className={cn('size-2 rounded-full', LEVEL_CLASSES[4])} />
            <span>More</span>
          </div>

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
