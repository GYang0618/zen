import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@zen/ui'
import { Funnel, FunnelChart as RechartsFunnelChart } from 'recharts'

import {
  CHART_COLOR_TOKENS,
  ChartCardShell,
  createCategoryConfig,
  withCategoryFills
} from './chart-shared'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { BaseChartProps } from './chart-shared'

export interface FunnelChartProps extends BaseChartProps {
  showConversionRate?: boolean
  unit?: string
}

export function FunnelChart({ props }: RendererProps<FunnelChartProps>) {
  const data = props.data ?? []
  const showConversionRate = props.showConversionRate ?? true
  const unit = props.unit ?? ''

  const config = createCategoryConfig(data)
  const chartData = withCategoryFills(data)

  const firstValue = data[0]?.value || 1

  return (
    <ChartCardShell title={props.title} description={props.description}>
      <div className="flex flex-col gap-4">
        <ChartContainer config={config} className="aspect-auto mx-auto h-64 w-full">
          <RechartsFunnelChart
            accessibilityLayer
            margin={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="category"
                  formatter={(val, _name, item) => (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{item.payload.label}:</span>
                      <span className="font-mono tabular-nums">
                        {Number(val).toLocaleString()}
                        {unit}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Funnel dataKey="value" data={chartData} isAnimationActive>
              {/* Recharts Funnel utilizes fill from data items */}
            </Funnel>
          </RechartsFunnelChart>
        </ChartContainer>

        {showConversionRate && data.length > 0 && (
          <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-3 sm:grid-cols-3 md:grid-cols-4">
            {data.map((item, index) => {
              const prevValue = index > 0 ? data[index - 1].value : null
              const stepRate = prevValue ? ((item.value / prevValue) * 100).toFixed(1) : null
              const overallRate = ((item.value / firstValue) * 100).toFixed(1)
              const color = CHART_COLOR_TOKENS[index % CHART_COLOR_TOKENS.length]

              return (
                <div
                  key={item.label}
                  className="flex flex-col rounded-md border border-border/40 bg-muted/30 p-2 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      {item.value.toLocaleString()}
                      {unit}
                    </span>
                    <span className="text-[10px] text-muted-foreground">留存 {overallRate}%</span>
                  </div>
                  {stepRate !== null && (
                    <div className="mt-1 text-[10px] text-muted-foreground/80">
                      上阶段转化: <span className="font-mono font-medium">{stepRate}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ChartCardShell>
  )
}
