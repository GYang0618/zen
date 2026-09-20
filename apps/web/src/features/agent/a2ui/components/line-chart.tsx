import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@zen/ui'
import { CartesianGrid, Line, LineChart as RechartsLine, XAxis, YAxis } from 'recharts'

import { ChartCardShell, createSingleSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export type LineChartProps = BaseChartProps

export function LineChart({ props }: RendererProps<LineChartProps>) {
  const data = props.data ?? []
  const config = createSingleSeriesConfig('数值')

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <RechartsLine accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
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
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </RechartsLine>
      </ChartContainer>
    </ChartCardShell>
  )
}
