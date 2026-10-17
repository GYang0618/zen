import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@zen/ui'
import {
  Bar,
  CartesianGrid,
  Line,
  ComposedChart as RechartsComposedChart,
  XAxis,
  YAxis
} from 'recharts'

import { ChartCardShell } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { ChartConfig } from '@zen/ui'

export interface ComposedChartDataItem {
  label: string
  barValue: number
  lineValue: number
}

export interface ComposedChartProps {
  title?: string
  description?: string
  data: ComposedChartDataItem[]
  barLabel?: string
  lineLabel?: string
  barUnit?: string
  lineUnit?: string
  secondaryAxis?: boolean
}

export function ComposedChart({ props }: RendererProps<ComposedChartProps>) {
  const data = props.data ?? []
  const barLabel = props.barLabel ?? '数值'
  const lineLabel = props.lineLabel ?? '比率'
  const barUnit = props.barUnit ?? ''
  const lineUnit = props.lineUnit ?? ''
  const secondaryAxis = props.secondaryAxis ?? true

  const config: ChartConfig = {
    barValue: {
      label: barLabel,
      color: 'var(--chart-1)'
    },
    lineValue: {
      label: lineLabel,
      color: 'var(--chart-2)'
    }
  }

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <RechartsComposedChart
          accessibilityLayer
          data={data}
          margin={{ top: 8, left: 8, right: secondaryAxis ? 16 : 8, bottom: 4 }}
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
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            width={40}
            unit={barUnit}
          />
          {secondaryAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              width={40}
              unit={lineUnit}
            />
          )}
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            yAxisId="left"
            dataKey="barValue"
            fill="var(--color-barValue)"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId={secondaryAxis ? 'right' : 'left'}
            type="monotone"
            dataKey="lineValue"
            stroke="var(--color-lineValue)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </RechartsComposedChart>
      </ChartContainer>
    </ChartCardShell>
  )
}
