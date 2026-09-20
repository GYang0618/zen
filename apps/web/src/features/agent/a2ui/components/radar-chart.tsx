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
import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadar } from 'recharts'

import { createSingleSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export type RadarChartProps = BaseChartProps

export function RadarChart({ props }: RendererProps<RadarChartProps>) {
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
        <ChartContainer config={config} className="aspect-auto mx-auto h-72 w-full">
          <RechartsRadar accessibilityLayer data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar
              dataKey="value"
              fill="var(--color-value)"
              fillOpacity={0.2}
              stroke="var(--color-value)"
            />
          </RechartsRadar>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
