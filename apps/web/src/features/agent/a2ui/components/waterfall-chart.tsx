import { Card, CardContent, CardHeader, CardTitle, cn } from '@zen/ui'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useMemo } from 'react'

import { OverflowText } from './overflow-text'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface WaterfallStep {
  label: string
  value: number
  formattedValue?: string
  isTotal?: boolean
}

export interface WaterfallChartProps {
  title: string
  value?: string
  trendValue?: string
  trend?: 'up' | 'down' | 'neutral'
  baseline?: number
  max?: number
  steps: WaterfallStep[]
  legend?: {
    totalLabel?: string
    gainLabel?: string
    lossLabel?: string
  }
  footer?: string
  className?: string
}

export function WaterfallChart({ props }: RendererProps<WaterfallChartProps>) {
  const {
    title,
    value,
    trendValue,
    trend = 'up',
    baseline: explicitBaseline,
    max: explicitMax,
    steps = [],
    legend,
    footer,
    className
  } = props

  const isUp = trend === 'up'
  const isDown = trend === 'down'

  const totalLabel = legend?.totalLabel ?? '合计'
  const gainLabel = legend?.gainLabel ?? '增加'
  const lossLabel = legend?.lossLabel ?? '减少'

  // 计算每个步骤的起始值、结束值与累积值
  const computedSteps = useMemo(() => {
    let current = 0
    const calculated = []

    for (const step of steps) {
      if (step.isTotal) {
        // 总额步骤（如起始 MRR 或最终 MRR）
        calculated.push({
          ...step,
          type: 'total' as const,
          start: 0,
          end: Math.abs(step.value),
          change: step.value
        })
        current = step.value
      } else {
        // 增减变动步骤
        const isGain = step.value >= 0
        const start = isGain ? current : current + step.value
        const end = isGain ? current + step.value : current
        calculated.push({
          ...step,
          type: (isGain ? 'gain' : 'loss') as 'gain' | 'loss',
          start,
          end,
          change: step.value
        })
        current += step.value
      }
    }
    return calculated
  }, [steps])

  // 计算坐标轴最小值与最大值
  const { axisMin, axisMax } = useMemo(() => {
    const allPoints = computedSteps.flatMap((s) => [s.start, s.end])
    const minVal = allPoints.length > 0 ? Math.min(...allPoints) : 0
    const maxVal = allPoints.length > 0 ? Math.max(...allPoints) : 100

    const finalMin = explicitBaseline !== undefined ? explicitBaseline : Math.max(0, minVal * 0.85)
    const finalMax = explicitMax !== undefined ? explicitMax : maxVal * 1.05

    return { axisMin: finalMin, axisMax: finalMax }
  }, [computedSteps, explicitBaseline, explicitMax])

  const axisSpan = axisMax - axisMin || 1

  return (
    <Card className={cn('@container/chart h-full w-full', className)}>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="min-w-0 text-sm font-semibold text-foreground @sm/chart:text-base">
          <OverflowText>{title}</OverflowText>
        </CardTitle>

        {value && (
          <div className="flex items-baseline gap-2.5 pt-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-foreground @sm/chart:text-3xl">
              {value}
            </span>
            {trendValue && (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-mono text-xs font-medium @sm/chart:text-sm',
                  isUp
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isDown
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-muted-foreground'
                )}
              >
                {isUp && <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />}
                {isDown && <ArrowDownRight className="size-3.5 shrink-0" aria-hidden />}
                {trendValue}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* 瀑布行列表 */}
        <div className="space-y-3">
          {computedSteps.map((step, idx) => {
            const leftPct = Math.min(100, Math.max(0, ((step.start - axisMin) / axisSpan) * 100))
            const rightPct = Math.min(100, Math.max(0, ((step.end - axisMin) / axisSpan) * 100))
            const barWidthPct = Math.max(2, rightPct - leftPct)

            let barColor = 'bg-foreground dark:bg-foreground'
            if (step.type === 'gain') {
              barColor = 'bg-muted-foreground/80 dark:bg-muted-foreground/80'
            } else if (step.type === 'loss') {
              barColor = 'bg-muted-foreground/35 dark:bg-muted-foreground/40'
            }

            const formattedDisplay =
              step.formattedValue ??
              (step.type === 'total'
                ? `$${Math.round(step.end).toLocaleString()}`
                : `${step.change >= 0 ? '+' : '-'}$${Math.abs(Math.round(step.change)).toLocaleString()}`)

            return (
              <div key={`${step.label}-${idx}`} className="flex items-center gap-3 text-xs py-0.5">
                {/* 标签列 */}
                <div className="w-24 shrink-0 @sm/chart:w-28">
                  <OverflowText
                    className={
                      step.type === 'total'
                        ? 'font-semibold text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {step.label}
                  </OverflowText>
                </div>

                {/* 瀑布条轨道容器 */}
                <div className="relative flex-1 h-3.5 rounded-full bg-muted/20 overflow-hidden">
                  <div
                    className={cn(
                      'absolute h-full rounded-full transition-all duration-300',
                      barColor
                    )}
                    style={{ left: `${leftPct}%`, width: `${barWidthPct}%` }}
                    title={`${step.label}: ${formattedDisplay}`}
                  />
                </div>

                {/* 右侧数值 */}
                <div
                  className={cn(
                    'w-20 shrink-0 text-right font-mono tabular-nums @sm/chart:w-24',
                    step.type === 'total'
                      ? 'font-bold text-foreground'
                      : 'font-medium text-foreground/90'
                  )}
                >
                  {formattedDisplay}
                </div>
              </div>
            )
          })}
        </div>

        {/* 图例 (Legend) */}
        <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground shrink-0" />
            <span>{totalLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/80 shrink-0" />
            <span>{gainLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/35 shrink-0" />
            <span>{lossLabel}</span>
          </div>
        </div>

        {/* 底部备注说明 */}
        {footer && (
          <p className="border-t border-border/40 pt-2.5 text-xs text-muted-foreground leading-relaxed">
            {footer}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
