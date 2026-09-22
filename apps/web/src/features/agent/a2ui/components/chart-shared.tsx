import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from '@zen/ui'

import type { ChartConfig } from '@zen/ui'
import type { ReactNode } from 'react'

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
  return (
    <Card className="h-full w-full">
      {(title || description) && (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      )}
      <CardContent className={cn('ps-2', contentClassName)}>{children}</CardContent>
    </Card>
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
