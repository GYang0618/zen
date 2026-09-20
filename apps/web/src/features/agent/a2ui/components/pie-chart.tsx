import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@zen/ui'
import { Cell, Pie, PieChart as RechartsPie } from 'recharts'

import { ChartCardShell, createCategoryConfig, withCategoryFills } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export type PieChartProps = BaseChartProps

export function PieChart({ props }: RendererProps<PieChartProps>) {
  const data = props.data ?? []
  const config = createCategoryConfig(data)
  const chartData = withCategoryFills(data)

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto mx-auto h-72 w-full">
        <RechartsPie accessibilityLayer>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="category" hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="category"
            innerRadius={48}
            stroke="var(--background)"
            strokeWidth={2}
          >
            {chartData.map((item) => (
              <Cell key={item.category} fill={item.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="category" />} />
        </RechartsPie>
      </ChartContainer>
    </ChartCardShell>
  )
}
