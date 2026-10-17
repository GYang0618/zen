import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@zen/ui'
import { useId } from 'react'
import { Area, CartesianGrid, AreaChart as RechartsArea, XAxis, YAxis } from 'recharts'

import { ChartCardShell, createMultiSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface StackedAreaSeriesDef {
  key: string
  label: string
}

export interface StackedAreaChartProps {
  title?: string
  description?: string
  series: StackedAreaSeriesDef[]
  data: Array<{ label: string; [key: string]: number | string }>
  curve?: 'monotone' | 'linear'
  showLegend?: boolean
}

export function StackedAreaChart({ props }: RendererProps<StackedAreaChartProps>) {
  const gradientPrefix = useId().replace(/:/g, '')
  const series = props.series ?? []
  const data = props.data ?? []
  const curve = props.curve ?? 'monotone'
  const showLegend = props.showLegend ?? true
  const config = createMultiSeriesConfig(series)

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <RechartsArea
          accessibilityLayer
          data={data}
          margin={{ top: 8, left: 8, right: 8, bottom: 4 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`${gradientPrefix}-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={`var(--color-${s.key})`} stopOpacity={0.4} />
                <stop offset="95%" stopColor={`var(--color-${s.key})`} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            width={40}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          {series.map((s) => (
            <Area
              key={s.key}
              type={curve}
              dataKey={s.key}
              stackId="1"
              stroke={`var(--color-${s.key})`}
              fill={`url(#${gradientPrefix}-${s.key})`}
              fillOpacity={1}
              strokeWidth={2}
            />
          ))}
        </RechartsArea>
      </ChartContainer>
    </ChartCardShell>
  )
}
