import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from '@zen/ui'
import { createContext, useContext } from 'react'

import { OverflowText } from './overflow-text'
import { useContainerWidth } from './use-container-width'

import type { ChartConfig } from '@zen/ui'
import type { ReactNode } from 'react'

const ChartCanvasWidthContext = createContext(0)

/** 当前图表卡片的内容宽度，供坐标轴分配标签空间。 */
export function useChartCanvasWidth() {
  return useContext(ChartCanvasWidthContext)
}

export interface ChartDataItem {
  label: string
  value: number
}

export interface BaseChartProps {
  title?: string
  description?: string
  data?: ChartDataItem[]
}

/** 图表统一卡片壳：h-full 以便在 Grid/Row stretch 下与同行等高。 */
export function ChartCardShell({
  title,
  description,
  children,
  contentClassName
}: {
  title?: string
  description?: string
  children: ReactNode
  contentClassName?: string
}) {
  const { ref, width } = useContainerWidth<HTMLDivElement>()

  return (
    <ChartCanvasWidthContext.Provider value={width}>
      <div ref={ref} className="@container/chart h-full min-w-0 w-full">
        <Card className="h-full w-full">
          {(title || description) && (
            <CardHeader className="min-w-0">
              {title ? (
                <CardTitle className="min-w-0">
                  <OverflowText>{title}</OverflowText>
                </CardTitle>
              ) : null}
              {description ? (
                <CardDescription className="min-w-0">
                  <OverflowText lines={2}>{description}</OverflowText>
                </CardDescription>
              ) : null}
            </CardHeader>
          )}
          <CardContent className={cn('min-w-0 ps-2', contentClassName)}>{children}</CardContent>
        </Card>
      </div>
    </ChartCanvasWidthContext.Provider>
  )
}

/**
 * 优先使用主题 `--chart-*`（由 base + brand accent 注入，随品牌色切换）。
 * 不要用 primary / 任意色值代替。
 */
export const CHART_COLOR_TOKENS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)'
] as const

export function createSingleSeriesConfig(label = '数值'): ChartConfig {
  return {
    value: {
      label,
      color: 'var(--chart-1)'
    }
  }
}

export function createCategoryConfig(data: ChartDataItem[]): ChartConfig {
  return Object.fromEntries(
    data.map((item, index) => [
      categoryKey(index),
      {
        label: item.label,
        color: CHART_COLOR_TOKENS[index % CHART_COLOR_TOKENS.length]
      }
    ])
  )
}

export function createMultiSeriesConfig(
  series: Array<{ key: string; label: string }>
): ChartConfig {
  return Object.fromEntries(
    series.map((item, index) => [
      item.key,
      {
        label: item.label,
        color: CHART_COLOR_TOKENS[index % CHART_COLOR_TOKENS.length]
      }
    ])
  )
}

export function withCategoryFills(data: ChartDataItem[]) {
  return data.map((item, index) => ({
    ...item,
    category: categoryKey(index),
    fill: `var(--color-${categoryKey(index)})`
  }))
}

function categoryKey(index: number) {
  return `c${index}`
}
