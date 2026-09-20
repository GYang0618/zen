import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@zen/ui'
import { PolarGrid, RadialBar, RadialBarChart as RechartsRadial } from 'recharts'

import { createCategoryConfig, withCategoryFills } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export type RadialChartProps = BaseChartProps

export function RadialChart({ props }: RendererProps<RadialChartProps>) {
  const data = props.data ?? []
  const config = createCategoryConfig(data)
  const chartData = withCategoryFills(data)

  return (
    <Card className="w-full">
      {(props.title || props.description) && (
        <CardHeader>
          {props.title ? <CardTitle>{props.title}</CardTitle> : null}
          {props.description ? <CardDescription>{props.description}</CardDescription> : null}
        </CardHeader>
      )}
      <CardContent className="ps-2">
        <ChartContainer config={config} className="aspect-auto mx-auto h-72 w-full">
          <RechartsRadial accessibilityLayer data={chartData} innerRadius={36} outerRadius={110}>
            <PolarGrid gridType="circle" />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="category" hideLabel />}
            />
            <RadialBar dataKey="value" background cornerRadius={6} />
          </RechartsRadial>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
