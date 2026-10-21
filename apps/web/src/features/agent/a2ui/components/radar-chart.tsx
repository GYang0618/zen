import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@zen/ui'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadar } from 'recharts'

import { ChartCategoryTick } from './chart-axes'
import { ChartCardShell, createSingleSeriesConfig, useChartCanvasWidth } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export type RadarChartProps = BaseChartProps

export function RadarChart({ props }: RendererProps<RadarChartProps>) {
  const data = props.data ?? []
  const config = createSingleSeriesConfig('数值')

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto mx-auto h-72 w-full">
        <RadarPlot data={data} />
      </ChartContainer>
    </ChartCardShell>
  )
}

function RadarPlot({ data }: { data: NonNullable<RadarChartProps['data']> }) {
  const canvasWidth = useChartCanvasWidth()
  const slotWidth = canvasWidth > 0 && canvasWidth < 360 ? 56 : 76

  return (
    <RechartsRadar
      accessibilityLayer
      data={data}
      margin={{ top: 16, right: 24, bottom: 16, left: 24 }}
    >
      <PolarGrid />
      <PolarAngleAxis
        dataKey="label"
        tick={(props) => (
          <ChartCategoryTick
            x={Number(props.x)}
            y={Number(props.y)}
            payload={props.payload}
            textAnchor={props.textAnchor}
            slotWidth={slotWidth}
            lines={2}
          />
        )}
      />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Radar
        dataKey="value"
        fill="var(--color-value)"
        fillOpacity={0.2}
        stroke="var(--color-value)"
      />
    </RechartsRadar>
  )
}
