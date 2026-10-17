import { ChartContainer, ChartTooltip } from '@zen/ui'
import {
  CartesianGrid,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts'

import { ChartCardShell, createSingleSeriesConfig } from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface ScatterDataItem {
  x: number
  y: number
  z?: number
  label?: string
  category?: string
}

export interface ScatterChartProps {
  title?: string
  description?: string
  data: ScatterDataItem[]
  xAxisLabel?: string
  yAxisLabel?: string
  xAxisUnit?: string
  yAxisUnit?: string
}

export function ScatterChart({ props }: RendererProps<ScatterChartProps>) {
  const data = props.data ?? []
  const xAxisLabel = props.xAxisLabel ?? 'X 轴'
  const yAxisLabel = props.yAxisLabel ?? 'Y 轴'
  const xAxisUnit = props.xAxisUnit ?? ''
  const yAxisUnit = props.yAxisUnit ?? ''

  const config = createSingleSeriesConfig(yAxisLabel)

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <RechartsScatterChart
          accessibilityLayer
          margin={{ top: 12, right: 16, bottom: 12, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisLabel}
            unit={xAxisUnit}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisLabel}
            unit={yAxisUnit}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            width={48}
          />
          <ZAxis type="number" dataKey="z" range={[60, 200]} />
          <ChartTooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as ScatterDataItem

              return (
                <div className="grid min-w-32 gap-1 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                  {item.label && <div className="font-semibold text-foreground">{item.label}</div>}
                  {item.category && (
                    <div className="text-[10px] text-muted-foreground">{item.category}</div>
                  )}
                  <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
                    <span>{xAxisLabel}:</span>
                    <span className="font-mono font-medium text-foreground">
                      {item.x.toLocaleString()}
                      {xAxisUnit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-muted-foreground">
                    <span>{yAxisLabel}:</span>
                    <span className="font-mono font-medium text-foreground">
                      {item.y.toLocaleString()}
                      {yAxisUnit}
                    </span>
                  </div>
                </div>
              )
            }}
          />
          <Scatter
            name="分布数据"
            data={data}
            fill="var(--color-value)"
            className="stroke-background stroke-2"
          />
        </RechartsScatterChart>
      </ChartContainer>
    </ChartCardShell>
  )
}
