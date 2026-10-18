import { ChartContainer, cn } from '@zen/ui'
import { Cell, Pie, PieChart as RechartsPie } from 'recharts'

import { ChartCardShell } from './chart-shared'

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

export function GaugeChart({ props }: RendererProps<GaugeChartProps>) {
  const value = props.value ?? 0
  const min = props.min ?? 0
  const max = props.max ?? 100
  const unit = props.unit ?? '%'
  const subtext = props.subtext
  const status = props.status ?? 'default'

  // 限制进度范围在 min 与 max 之间
  const clampedValue = Math.min(Math.max(value, min), max)
  const range = max - min || 1
  const progressRatio = (clampedValue - min) / range

  const progressValue = progressRatio * 100
  const remainingValue = 100 - progressValue

  const activeColor = STATUS_COLOR_MAP[status] ?? STATUS_COLOR_MAP.default

  const chartData = [
    { name: 'progress', value: progressValue, fill: activeColor },
    { name: 'track', value: remainingValue, fill: 'var(--muted)' }
  ]

  const config: ChartConfig = {
    progress: {
      label: '当前值',
      color: activeColor
    },
    track: {
      label: '剩余',
      color: 'var(--muted)'
    }
  }

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <div className="relative mx-auto flex h-64 w-full max-w-sm flex-col items-center justify-center">
        <ChartContainer config={config} className="h-full w-full">
          <RechartsPie accessibilityLayer>
            <Pie
              data={chartData}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              innerRadius={72}
              outerRadius={96}
              cy="75%"
              stroke="var(--background)"
              strokeWidth={3}
              cornerRadius={6}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </RechartsPie>
        </ChartContainer>

        {/* 仪表盘中心数值与辅助标签 */}
        <div className="absolute top-[48%] flex max-w-[160px] flex-col items-center px-2 text-center">
          <div className="flex items-baseline gap-0.5">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
              {value.toLocaleString()}
            </span>
            {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
          </div>
          {subtext && (
            <p className="mt-1 max-w-[200px] truncate text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>

        {/* 底部量程端点 */}
        <div className="absolute bottom-6 flex w-full max-w-[210px] items-center justify-between px-2 text-[11px] font-medium text-muted-foreground">
          <span>
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
          <span>
            {max}
            {unit}
          </span>
        </div>
      </div>
    </ChartCardShell>
  )
}
