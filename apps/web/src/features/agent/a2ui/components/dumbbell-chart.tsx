import { Card, CardContent, CardHeader, CardTitle, cn } from '@zen/ui'
import { useMemo } from 'react'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface DumbbellItem {
  label: string
  before: number
  after: number
  unit?: string
  displayValue?: string
}

export interface DumbbellChartProps {
  title: string
  subtitle?: string
  summaryLabel?: string
  summaryValue?: string
  beforeLabel?: string
  afterLabel?: string
  items: DumbbellItem[]
  min?: number
  max?: number
  unit?: string
  ticks?: number[]
  footer?: string
  className?: string
}

export function DumbbellChart({ props }: RendererProps<DumbbellChartProps>) {
  const {
    title,
    subtitle,
    summaryLabel = 'Median change',
    summaryValue,
    beforeLabel = 'Before',
    afterLabel = 'After',
    items = [],
    min = 0,
    unit = 'ms',
    ticks: explicitTicks,
    footer,
    className
  } = props

  // 计算最大值，方便归一化坐标轴
  const computedMax = useMemo(() => {
    if (props.max !== undefined) return props.max
    const allValues = items.flatMap((i) => [i.before, i.after])
    const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100
    // 向上取整到合适的设计刻度
    return Math.ceil(maxVal * 1.15)
  }, [items, props.max])

  // 生成刻度
  const ticks = useMemo(() => {
    if (explicitTicks && explicitTicks.length > 0) return explicitTicks
    const step = computedMax / 4
    return [0, Math.round(step), Math.round(step * 2), Math.round(step * 3), computedMax]
  }, [explicitTicks, computedMax])

  const range = computedMax - min || 1

  return (
    <Card className={cn('h-full w-full', className)}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        {summaryValue && (
          <div className="text-right">
            {summaryLabel && (
              <span className="block text-xs font-normal text-muted-foreground">
                {summaryLabel}
              </span>
            )}
            <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-foreground">
              {summaryValue}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 图例 (Legend) */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/40 shrink-0" />
            <span>{beforeLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground shrink-0" />
            <span>{afterLabel}</span>
          </div>
        </div>

        {/* 棒铃行列表 (Dumbbell Rows) */}
        <div className="space-y-4 pt-1">
          {items.map((item, idx) => {
            const beforePct = Math.min(100, Math.max(0, ((item.before - min) / range) * 100))
            const afterPct = Math.min(100, Math.max(0, ((item.after - min) / range) * 100))

            const leftPct = Math.min(beforePct, afterPct)
            const widthPct = Math.max(2, Math.abs(beforePct - afterPct))

            const displayUnit = item.unit || unit
            const valueText = item.displayValue || `${item.before} → ${item.after} ${displayUnit}`

            return (
              <div
                key={`${item.label}-${idx}`}
                className="flex items-center gap-4 text-xs transition-colors hover:bg-muted/10 py-1"
              >
                {/* 接口/端点名称 */}
                <div className="w-28 sm:w-36 shrink-0 truncate font-mono font-medium text-foreground">
                  {item.label}
                </div>

                {/* 棒铃横杆与圆点坐标轴 */}
                <div className="relative flex-1 h-5 flex items-center">
                  {/* 连接细条 */}
                  <div
                    className="absolute h-1.5 rounded-full bg-muted-foreground/25 transition-all duration-300"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  />

                  {/* 变动前圆点 (Before - Light Gray) */}
                  <div
                    className="absolute size-3 -translate-x-1/2 rounded-full border border-background bg-muted-foreground/45 transition-all duration-300 shadow-xs"
                    style={{ left: `${beforePct}%` }}
                    title={`${beforeLabel}: ${item.before} ${displayUnit}`}
                  />

                  {/* 变动后圆点 (After - Dark Solid) */}
                  <div
                    className="absolute size-3 -translate-x-1/2 rounded-full border border-background bg-foreground transition-all duration-300 shadow-xs"
                    style={{ left: `${afterPct}%` }}
                    title={`${afterLabel}: ${item.after} ${displayUnit}`}
                  />
                </div>

                {/* 右侧数值比对文案 */}
                <div className="w-24 sm:w-28 shrink-0 text-right font-mono font-medium tabular-nums text-foreground">
                  {valueText}
                </div>
              </div>
            )
          })}
        </div>

        {/* X 轴刻度尺 */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/40 text-xs text-muted-foreground font-mono">
          <div className="w-28 sm:w-36 shrink-0" aria-hidden />
          <div className="relative flex-1 h-4">
            {ticks.map((tick, idx) => {
              const tickPct = Math.min(100, Math.max(0, ((tick - min) / range) * 100))
              const isFirst = idx === 0
              const isLast = idx === ticks.length - 1
              return (
                <span
                  key={`tick-${tick}`}
                  className={cn(
                    'absolute top-0 text-[11px] tabular-nums -translate-x-1/2',
                    isFirst && 'translate-x-0',
                    isLast && '-translate-x-full'
                  )}
                  style={{ left: `${tickPct}%` }}
                >
                  {tick} {isLast && unit ? unit : ''}
                </span>
              )
            })}
          </div>
          <div className="w-24 sm:w-28 shrink-0" aria-hidden />
        </div>

        {/* 底部补充说明 */}
        {footer && (
          <p className="pt-2 text-xs text-muted-foreground border-t border-border/30">{footer}</p>
        )}
      </CardContent>
    </Card>
  )
}
