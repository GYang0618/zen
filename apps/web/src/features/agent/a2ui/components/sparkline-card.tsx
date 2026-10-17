import { Card, CardContent, CardHeader, CardTitle, cn } from '@zen/ui'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { A2uiDynamicIcon } from './icon'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface SparklineDataPoint {
  value: number
  label?: string
}

export interface SparklineCardProps {
  title: string
  value: string
  period?: string
  data?: number[] | SparklineDataPoint[]
  type?: 'bar' | 'line'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: string
  className?: string
}

export function SparklineCard({ props }: RendererProps<SparklineCardProps>) {
  const {
    title,
    value,
    period = 'this week',
    data = [],
    type = 'bar',
    trend,
    trendValue,
    icon,
    className
  } = props

  const isUp = trend === 'up'
  const isDown = trend === 'down'

  const points: SparklineDataPoint[] = data.map((item) =>
    typeof item === 'number' ? { value: item } : item
  )

  const maxVal = Math.max(...points.map((p) => p.value), 1)
  const minVal = Math.min(...points.map((p) => p.value), 0)

  return (
    <Card className={cn('h-full w-full', className)}>
      <CardHeader className="space-y-0.5 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs sm:text-sm font-normal text-muted-foreground">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-muted-foreground">
              <A2uiDynamicIcon name={icon} size={14} className="size-3.5" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
            {value}
          </span>

          {trendValue && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium font-mono',
                isUp
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isDown
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-muted-foreground'
              )}
            >
              {isUp && <ArrowUpRight className="size-3 shrink-0" aria-hidden />}
              {isDown && <ArrowDownRight className="size-3 shrink-0" aria-hidden />}
              {trendValue}
            </span>
          )}
        </div>

        {period && <p className="text-xs font-normal text-muted-foreground">{period}</p>}

        {/* 底部微型走势图 (Mini Sparkline) */}
        {points.length > 0 && (
          <div className="pt-2">
            {type === 'bar' ? (
              <div role="img" className="flex h-8 w-full items-end gap-1.5" aria-label="微型柱状图">
                {points.map((pt, idx) => {
                  const heightPct = Math.max(12, Math.round((pt.value / maxVal) * 100))
                  const key = pt.label ? `${pt.label}-${idx}` : `spark-bar-${idx}`
                  return (
                    <div
                      key={key}
                      className="flex-1 rounded-[2px] bg-muted-foreground/25 transition-colors hover:bg-muted-foreground/50"
                      style={{ height: `${heightPct}%` }}
                      title={pt.label ? `${pt.label}: ${pt.value}` : String(pt.value)}
                    />
                  )
                })}
              </div>
            ) : (
              /* 折线走势微图 (Line Sparkline) */
              <div role="img" className="h-8 w-full" aria-label="微型折线图">
                <svg
                  className="size-full overflow-visible"
                  viewBox={`0 0 ${points.length * 10} 32`}
                  preserveAspectRatio="none"
                >
                  <title>{title} 趋势线</title>
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground/70"
                    points={points
                      .map((pt, idx) => {
                        const x = idx * 10 + 5
                        const range = maxVal - minVal || 1
                        const y = 30 - ((pt.value - minVal) / range) * 26
                        return `${x},${y}`
                      })
                      .join(' ')}
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
