import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@zen/ui'
import { useMemo } from 'react'
import { Bar, CartesianGrid, LabelList, BarChart as RechartsBar, XAxis, YAxis } from 'recharts'

import { ChartCardShell, createSingleSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export interface HorizontalBarChartProps extends BaseChartProps {
  sorted?: 'asc' | 'desc' | 'none'
  showValues?: boolean
  valueUnit?: string
}

export function HorizontalBarChart({ props }: RendererProps<HorizontalBarChartProps>) {
  const rawData = props.data ?? []
  const sorted = props.sorted ?? 'none'
  const showValues = props.showValues ?? true
  const valueUnit = props.valueUnit ?? ''

  const data = useMemo(() => {
    if (sorted === 'desc') {
      return [...rawData].sort((a, b) => b.value - a.value)
    }
    if (sorted === 'asc') {
      return [...rawData].sort((a, b) => a.value - b.value)
    }
    return rawData
  }, [rawData, sorted])

  const config = createSingleSeriesConfig('数值')
  const chartHeight = Math.max(280, data.length * 36)

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer
        config={config}
        className="aspect-auto w-full"
        style={{ height: `${chartHeight}px` }}
      >
        <RechartsBar
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ top: 8, right: showValues ? 48 : 16, bottom: 8, left: 16 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            width={90}
            interval={0}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]}>
            {showValues && (
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
    </ChartCardShell>
  )
}
