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
import { Area, CartesianGrid, AreaChart as RechartsArea, XAxis, YAxis } from 'recharts'

import { createSingleSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export type AreaChartProps = BaseChartProps

export function AreaChart({ props }: RendererProps<AreaChartProps>) {
  const data = props.data ?? []
  const config = createSingleSeriesConfig('数值')

  return (
    <Card className="w-full">
      {(props.title || props.description) && (
        <CardHeader>
          {props.title ? <CardTitle>{props.title}</CardTitle> : null}
          {props.description ? <CardDescription>{props.description}</CardDescription> : null}
        </CardHeader>
      )}
      <CardContent className="ps-2">
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
      </CardContent>
    </Card>
  )
}
