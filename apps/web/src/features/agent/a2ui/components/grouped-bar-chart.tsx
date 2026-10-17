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

export interface GroupedBarSeriesDef {
  key: string
  label: string
}

export interface GroupedBarChartProps {
  title?: string
  description?: string
  series: GroupedBarSeriesDef[]
  data: Array<{ label: string; [key: string]: number | string }>
  showLegend?: boolean
}

export function GroupedBarChart({ props }: RendererProps<GroupedBarChartProps>) {
  const series = props.series ?? []
  const data = props.data ?? []
  const showLegend = props.showLegend ?? true
  const config = createMultiSeriesConfig(series)

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <RechartsBar
          accessibilityLayer
          data={data}
          margin={{ top: 8, left: 8, right: 8, bottom: 4 }}
        >
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
          <ChartTooltip content={<ChartTooltipContent />} />
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={[4, 4, 0, 0]} />
          ))}
        </RechartsBar>
      </ChartContainer>
    </ChartCardShell>
  )
}
