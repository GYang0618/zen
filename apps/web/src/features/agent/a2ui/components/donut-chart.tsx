import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  cn
} from '@zen/ui'
import { ArrowDownRight, ArrowUpRight, MoreHorizontal, PieChart as PieIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Cell, Pie, PieChart as RechartsPie } from 'recharts'

import { A2uiDynamicIcon } from './icon'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { ChartConfig } from '@zen/ui'

export interface DonutCategoryItem {
  label: string
  value: number
  formattedValue?: string
  percentage?: string | number
  color?: string
}

export interface DonutChartProps {
  title?: string
  description?: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  centerValue?: string | number
  centerLabel?: string
  data?: DonutCategoryItem[]
  innerRadius?: number
  outerRadius?: number
  layout?: 'side-by-side' | 'stacked'
  showActionMenu?: boolean
  className?: string
}

const DEFAULT_DONUT_COLORS = [
  'var(--chart-1, #18181b)',
  'var(--chart-2, #52525b)',
  'var(--chart-3, #71717a)',
  'var(--chart-4, #a1a1aa)',
  'var(--chart-5, #d4d4d8)'
]

export function DonutChart({ props }: RendererProps<DonutChartProps>) {
  const {
    title = 'Sales by Category',
    description,
    icon,
    trend = 'up',
    trendValue,
    centerLabel = 'Total',
    innerRadius = 54,
    outerRadius = 82,
    layout = 'side-by-side',
    showActionMenu = true,
    data = [],
    className
  } = props

  const isUp = trend === 'up'
  const isDown = trend === 'down'

  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + (item.value || 0), 0)
  }, [data])

  const displayCenterValue =
    props.centerValue !== undefined
      ? props.centerValue
      : totalValue > 0
        ? totalValue.toLocaleString()
        : '0'

  const processedData = useMemo(() => {
    return data.map((item, index) => {
      const color = item.color || DEFAULT_DONUT_COLORS[index % DEFAULT_DONUT_COLORS.length]
      const rawPct = totalValue > 0 ? (item.value / totalValue) * 100 : 0
      const displayPct =
        item.percentage !== undefined
          ? typeof item.percentage === 'number'
            ? `${item.percentage}%`
            : item.percentage
          : `${Math.round(rawPct)}%`
      const displayVal = item.formattedValue ?? item.value.toLocaleString()

      return {
        ...item,
        category: `c${index}`,
        color,
        fill: color,
        percentageDisplay: displayPct,
        formattedValueDisplay: displayVal
      }
    })
  }, [data, totalValue])

  const chartConfig = useMemo<ChartConfig>(() => {
    return Object.fromEntries(
      processedData.map((item) => [
        item.category,
        {
          label: item.label,
          color: item.color
        }
      ])
    )
  }, [processedData])

  const isSideBySide = layout === 'side-by-side'

  return (
    <Card className={cn('h-full w-full', className)}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
              {icon ? (
                <A2uiDynamicIcon name={icon} size={16} className="size-4" />
              ) : (
                <PieIcon className="size-4" aria-hidden />
              )}
            </div>
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          </div>

          {trendValue && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium pl-0.5',
                isUp
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isDown
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-muted-foreground'
              )}
            >
              {isUp && <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />}
              {isDown && <ArrowDownRight className="size-3.5 shrink-0" aria-hidden />}
              <span>{trendValue}</span>
            </div>
          )}

          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>

        {showActionMenu && (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="更多操作"
          >
            <MoreHorizontal className="size-4" />
          </button>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        <div
          className={cn(
            'flex w-full items-center',
            isSideBySide
              ? 'flex-col sm:flex-row sm:justify-between sm:gap-6'
              : 'flex-col justify-center gap-4'
          )}
        >
          {/* 左侧环形图容器 */}
          <div className="relative flex size-48 shrink-0 items-center justify-center sm:size-52">
            <ChartContainer config={chartConfig} className="size-full">
              <RechartsPie accessibilityLayer>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      nameKey="category"
                      hideLabel
                      formatter={(val, _name, item) => {
                        const num = Number(val)
                        const pct = totalValue > 0 ? ((num / totalValue) * 100).toFixed(1) : '0'
                        return (
                          <div className="flex w-full items-center justify-between gap-4 font-sans text-xs">
                            <span className="text-muted-foreground">{item.payload.label}:</span>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-semibold text-foreground">
                                {item.payload.formattedValueDisplay || num.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-muted-foreground">({pct}%)</span>
                            </div>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Pie
                  data={processedData}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  stroke="var(--background)"
                  strokeWidth={3}
                >
                  {processedData.map((item) => (
                    <Cell key={item.category} fill={item.fill} />
                  ))}
                </Pie>
              </RechartsPie>
            </ChartContainer>

            {/* 环心指标展示 */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                {displayCenterValue}
              </span>
              <span className="text-xs font-medium text-muted-foreground">{centerLabel}</span>
            </div>
          </div>

          {/* 右侧详细明细列表 */}
          <div className="w-full flex-1 space-y-3 pt-2 sm:pt-0">
            {processedData.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between gap-3 text-sm transition-colors hover:opacity-90"
              >
                {/* 颜色圆点与类别名 */}
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate font-medium text-muted-foreground">{item.label}</span>
                </div>

                {/* 金额/数值与占比 */}
                <div className="flex shrink-0 items-center gap-3 font-mono tabular-nums">
                  <span className="font-semibold text-foreground">
                    {item.formattedValueDisplay}
                  </span>
                  <span className="w-9 text-right text-xs text-muted-foreground">
                    {item.percentageDisplay}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
