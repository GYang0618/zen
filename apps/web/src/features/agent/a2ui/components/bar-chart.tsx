import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@zen/ui'
import { Bar, CartesianGrid, BarChart as RechartsBar } from 'recharts'

import { ChartCategoryXAxis, ChartValueYAxis } from './chart-axes'
import { ChartCardShell, createSingleSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export type BarChartProps = BaseChartProps

export function BarChart({ props }: RendererProps<BarChartProps>) {
  const data = props.data ?? []
  const config = createSingleSeriesConfig('数值')

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <RechartsBar accessibilityLayer data={data} margin={{ left: 8, right: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} />
          <ChartCategoryXAxis count={data.length} />
          <ChartValueYAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ChartContainer>
    </ChartCardShell>
  )
}
