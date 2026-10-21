import { ChartContainer, cn } from '@zen/ui'
import { Cell, Pie, PieChart as RechartsPie } from 'recharts'

import { ChartCardShell } from './chart-shared'
import { OverflowText } from './overflow-text'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { ChartConfig } from '@zen/ui'

export interface GaugeChartProps {
  title?: string
  description?: string
  value: number
  max?: number
  min?: number
  unit?: string
  subtext?: string
  status?: 'default' | 'success' | 'warning' | 'destructive'
}

const STATUS_COLOR_MAP: Record<NonNullable<GaugeChartProps['status']>, string> = {
  default: 'var(--chart-1)',
  success: 'oklch(0.627 0.194 149.214)',
  warning: 'oklch(0.769 0.188 70.08)',
  destructive: 'var(--destructive)'
}

/** 可见窗口略高于半圆直径，避免描边被裁切。 */
const GAUGE_VIEWPORT_RATIO = '54%'

export function GaugeChart({ props }: RendererProps<GaugeChartProps>) {
  const value = props.value ?? 0
  const min = props.min ?? 0
  const max = props.max ?? 100
  const unit = props.unit ?? '%'
  const subtext = props.subtext
  const status = props.status ?? 'default'

  const clampedValue = Math.min(Math.max(value, min), max)
  const range = max - min || 1
  const progressRatio = (clampedValue - min) / range
  const progressValue = progressRatio * 100
  const activeColor = STATUS_COLOR_MAP[status] ?? STATUS_COLOR_MAP.default

  const chartData = [
    { name: 'progress', value: progressValue, fill: activeColor },
    { name: 'track', value: 100 - progressValue, fill: 'var(--muted)' }
  ]

  const config: ChartConfig = {
    progress: { label: '当前值', color: activeColor },
    track: { label: '剩余', color: 'var(--muted)' }
  }

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <div className="@container/gauge mx-auto flex w-full max-w-sm flex-col">
        <div
          className="relative w-full overflow-hidden"
          style={{ paddingBottom: GAUGE_VIEWPORT_RATIO }}
        >
          <div className="absolute inset-x-0 top-0 aspect-square">
            <ChartContainer config={config} className="aspect-square h-full w-full">
              <RechartsPie accessibilityLayer>
                <Pie
                  data={chartData}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="86%"
                  stroke="var(--background)"
                  strokeWidth={3}
                  cornerRadius={6}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </RechartsPie>
            </ChartContainer>
          </div>
          <div className="pointer-events-none absolute inset-x-[27%] top-[58%] flex items-baseline justify-center gap-0.5">
            <span className="font-mono text-xl font-bold tracking-tight text-foreground @xs/gauge:text-2xl @sm/gauge:text-3xl">
              {value.toLocaleString()}
            </span>
            {unit ? (
              <span className="text-sm font-medium text-muted-foreground">{unit}</span>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] font-medium text-muted-foreground">
          <span className="shrink-0">
            {min}
            {unit}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              status === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              status === 'warning' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              status === 'destructive' && 'bg-destructive/10 text-destructive',
              status === 'default' && 'bg-primary/10 text-primary'
            )}
          >
            {Math.round(progressRatio * 100)}%
          </span>
          <span className="shrink-0">
            {max}
            {unit}
          </span>
        </div>

        {subtext ? (
          <OverflowText className="mt-1.5 px-1 text-center text-xs text-muted-foreground">
            {subtext}
          </OverflowText>
        ) : null}
      </div>
    </ChartCardShell>
  )
}
