import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@zen/ui'
import { Area, CartesianGrid, AreaChart as RechartsArea, XAxis, YAxis } from 'recharts'

import { ChartCardShell, createSingleSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export type AreaChartProps = BaseChartProps

export function AreaChart({ props }: RendererProps<AreaChartProps>) {
  const data = props.data ?? []
  const config = createSingleSeriesConfig('数值')

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <RechartsArea accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
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
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            fill="var(--color-value)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RechartsArea>
      </ChartContainer>
    </ChartCardShell>
  )
}
