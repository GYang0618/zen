import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@zen/ui'
import { Bar, CartesianGrid, BarChart as RechartsBar } from 'recharts'

import {
  ChartCategoryXAxis,
  ChartCategoryYAxis,
  ChartValueXAxis,
  ChartValueYAxis,
  horizontalBarChartHeight
} from './chart-axes'
import { ChartCardShell, createMultiSeriesConfig, useChartCanvasWidth } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface StackedBarSeriesDef {
  key: string
  label: string
}

export interface StackedBarChartProps {
  title?: string
  description?: string
  series: StackedBarSeriesDef[]
  data: Array<{ label: string; [key: string]: number | string }>
  layout?: 'vertical' | 'horizontal'
  showLegend?: boolean
}

export function StackedBarChart({ props }: RendererProps<StackedBarChartProps>) {
  const series = props.series ?? []
  const data = props.data ?? []
  const isHorizontal = props.layout === 'horizontal'
  const showLegend = props.showLegend ?? true
  const config = createMultiSeriesConfig(series)

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <StackedBarBody
        series={series}
        data={data}
        isHorizontal={isHorizontal}
        showLegend={showLegend}
        config={config}
      />
    </ChartCardShell>
  )
}

function StackedBarBody({
  series,
  data,
  isHorizontal,
  showLegend,
  config
}: {
  series: StackedBarSeriesDef[]
  data: StackedBarChartProps['data']
  isHorizontal: boolean
  showLegend: boolean
  config: ReturnType<typeof createMultiSeriesConfig>
}) {
  const canvasWidth = useChartCanvasWidth()
  const labels = data.map((item) => String(item.label ?? ''))
  const chartHeight = isHorizontal ? horizontalBarChartHeight(labels, canvasWidth) : undefined

  return (
    <ChartContainer
      config={config}
      className={chartHeight ? 'aspect-auto w-full' : 'aspect-auto h-72 w-full'}
      style={chartHeight ? { height: `${chartHeight}px` } : undefined}
    >
      <RechartsBar
        accessibilityLayer
        data={data}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 8, left: 4, right: 8, bottom: 8 }}
      >
        <CartesianGrid vertical={!isHorizontal} horizontal={isHorizontal} />
        {isHorizontal ? (
          <>
            <ChartValueXAxis />
            <ChartCategoryYAxis labels={labels} />
          </>
        ) : (
          <>
            <ChartCategoryXAxis count={data.length} />
            <ChartValueYAxis />
          </>
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <ChartLegend content={<ChartLegendContent className="flex-wrap px-2" />} />}
        {series.map((s, idx) => {
          const isLast = idx === series.length - 1
          const radius: [number, number, number, number] = isLast
            ? isHorizontal
              ? [0, 4, 4, 0]
              : [4, 4, 0, 0]
            : [0, 0, 0, 0]

          return (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="stack"
              fill={`var(--color-${s.key})`}
              radius={radius}
            />
          )
        })}
      </RechartsBar>
    </ChartContainer>
  )
}
