import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@zen/ui'
import { CartesianGrid, Line, LineChart as RechartsLine } from 'recharts'

import { ChartCategoryXAxis, ChartValueYAxis } from './chart-axes'
import { ChartCardShell, createMultiSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface MultiLineSeriesDef {
  key: string
  label: string
}

export interface MultiLineChartProps {
  title?: string
  description?: string
  series: MultiLineSeriesDef[]
  data: Array<{ label: string; [key: string]: number | string }>
  curve?: 'monotone' | 'linear' | 'step'
  showDots?: boolean
  showLegend?: boolean
}

export function MultiLineChart({ props }: RendererProps<MultiLineChartProps>) {
  const series = props.series ?? []
  const data = props.data ?? []
  const curve = props.curve ?? 'monotone'
  const showDots = props.showDots ?? false
  const showLegend = props.showLegend ?? true
  const config = createMultiSeriesConfig(series)

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <RechartsLine
          accessibilityLayer
          data={data}
          margin={{ top: 8, left: 8, right: 8, bottom: 4 }}
        >
          <CartesianGrid vertical={false} />
          <ChartCategoryXAxis count={data.length} />
          <ChartValueYAxis />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          {showLegend && (
            <ChartLegend content={<ChartLegendContent className="flex-wrap px-2" />} />
          )}
          {series.map((s) => (
            <Line
              key={s.key}
              type={curve}
              dataKey={s.key}
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              dot={showDots ? { r: 3 } : false}
              activeDot={{ r: 5 }}
            />
          ))}
        </RechartsLine>
      </ChartContainer>
    </ChartCardShell>
  )
}
