import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@zen/ui'
import { Bar, CartesianGrid, LabelList, BarChart as RechartsBar } from 'recharts'

import { ChartCategoryYAxis, ChartValueXAxis, horizontalBarChartHeight } from './chart-axes'
import { ChartCardShell, createSingleSeriesConfig, useChartCanvasWidth } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export interface HorizontalBarChartProps extends BaseChartProps {
  sorted?: 'asc' | 'desc' | 'none'
  showValues?: boolean
  valueUnit?: string
}

const END_LABEL_MIN_CANVAS = 300

export function HorizontalBarChart({ props }: RendererProps<HorizontalBarChartProps>) {
  return (
    <ChartCardShell title={props.title} description={props.description}>
      <HorizontalBarBody
        data={props.data ?? []}
        sorted={props.sorted ?? 'none'}
        showValues={props.showValues ?? true}
        valueUnit={props.valueUnit ?? ''}
      />
    </ChartCardShell>
  )
}

function HorizontalBarBody({
  data: rawData,
  sorted,
  showValues,
  valueUnit
}: {
  data: NonNullable<HorizontalBarChartProps['data']>
  sorted: NonNullable<HorizontalBarChartProps['sorted']>
  showValues: boolean
  valueUnit: string
}) {
  const canvasWidth = useChartCanvasWidth()
  const data = sortBars(rawData, sorted)
  const labels = data.map((item) => item.label)
  const config = createSingleSeriesConfig('数值')
  const chartHeight = horizontalBarChartHeight(labels, canvasWidth)
  const showEndLabels = showValues && (canvasWidth === 0 || canvasWidth >= END_LABEL_MIN_CANVAS)

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: `${chartHeight}px` }}
    >
      <RechartsBar
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ top: 8, right: showEndLabels ? 56 : 12, bottom: 8, left: 4 }}
      >
        <CartesianGrid horizontal={false} />
        <ChartValueXAxis />
        <ChartCategoryYAxis labels={labels} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]}>
          {showEndLabels && (
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              className="fill-foreground font-mono text-[11px]"
              formatter={(val: unknown) => `${Number(val ?? 0).toLocaleString()}${valueUnit}`}
            />
          )}
        </Bar>
      </RechartsBar>
    </ChartContainer>
  )
}

function sortBars(
  data: NonNullable<HorizontalBarChartProps['data']>,
  sorted: NonNullable<HorizontalBarChartProps['sorted']>
) {
  if (sorted === 'desc') return [...data].sort((a, b) => b.value - a.value)
  if (sorted === 'asc') return [...data].sort((a, b) => a.value - b.value)
  return data
}
