import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@zen/ui'
import { Bar, CartesianGrid, BarChart as RechartsBar, XAxis, YAxis } from 'recharts'

import { ChartCardShell, createMultiSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface StackedBarSeriesDef {
  key: string
  label: string
}

export interface StackedBarChartProps {
  title?: string
  description?: string
  series: StackedBarSeriesDef[]
  data: Array<{ label: string; [key: string]: number | string }>
  layout?: 'vertical' | 'horizontal'
  showLegend?: boolean
}

export function StackedBarChart({ props }: RendererProps<StackedBarChartProps>) {
  const series = props.series ?? []
  const data = props.data ?? []
  const isHorizontal = props.layout === 'horizontal'
  const showLegend = props.showLegend ?? true
  const config = createMultiSeriesConfig(series)

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <RechartsBar
          accessibilityLayer
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, left: 8, right: 8, bottom: 4 }}
        >
          <CartesianGrid vertical={!isHorizontal} horizontal={isHorizontal} />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                width={80}
              />
            </>
          ) : (
            <>
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
            </>
          )}
          <ChartTooltip content={<ChartTooltipContent />} />
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          {series.map((s, idx) => {
            const isLast = idx === series.length - 1
            const radius: [number, number, number, number] = isLast
              ? isHorizontal
                ? [0, 4, 4, 0]
                : [4, 4, 0, 0]
              : [0, 0, 0, 0]

            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="stack"
                fill={`var(--color-${s.key})`}
                radius={radius}
              />
            )
          })}
        </RechartsBar>
      </ChartContainer>
    </ChartCardShell>
  )
}
