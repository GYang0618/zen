import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@zen/ui'
import { Area, CartesianGrid, AreaChart as RechartsArea } from 'recharts'

import { ChartCategoryXAxis, ChartValueYAxis } from './chart-axes'
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
        <RechartsArea accessibilityLayer data={data} margin={{ left: 8, right: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="single-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <ChartCategoryXAxis count={data.length} />
          <ChartValueYAxis />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            fill="url(#single-area-gradient)"
            strokeWidth={2}
          />
        </RechartsArea>
      </ChartContainer>
    </ChartCardShell>
  )
}
