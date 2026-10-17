import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@zen/ui'
import { ArrowUpRight, Grid as GridIcon } from 'lucide-react'
import { useMemo } from 'react'

import { A2uiDynamicIcon } from './icon'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export type HeatmapIntensity = 'high' | 'medium' | 'low' | 'none'

export interface HeatmapCell {
  x: string | number
  y: string | number
  intensity?: HeatmapIntensity | number
  value?: string | number
  tooltip?: {
    title?: string
    subtitle?: string
    value?: string
  }
}

export interface HeatmapCardProps {
  title: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  xLabels: string[]
  yLabels: string[]
  cells: HeatmapCell[]
  legend?: Array<{ label: string; intensity: HeatmapIntensity }>
  className?: string
}

function resolveIntensityLevel(val?: HeatmapIntensity | number): HeatmapIntensity {
  if (val === undefined || val === null) return 'none'
  if (typeof val === 'string') return val
  if (val >= 60) return 'high'
  if (val >= 30) return 'medium'
  if (val > 0) return 'low'
  return 'none'
}

const INTENSITY_CLASSES: Record<HeatmapIntensity, string> = {
  high: 'bg-foreground dark:bg-foreground',
  medium: 'bg-muted-foreground/60 dark:bg-muted-foreground/60',
  low: 'bg-muted-foreground/25 dark:bg-muted-foreground/25',
  none: 'bg-muted/30 dark:bg-muted/30'
}

const DEFAULT_LEGEND: Array<{ label: string; intensity: HeatmapIntensity }> = [
  { label: 'High', intensity: 'high' },
  { label: 'Medium', intensity: 'medium' },
  { label: 'Low', intensity: 'low' }
]

export function HeatmapCard({ props }: RendererProps<HeatmapCardProps>) {
  const {
    title,
    icon,
    trend = 'up',
    trendValue,
    xLabels = [],
    yLabels = [],
    cells = [],
    legend = DEFAULT_LEGEND,
    className
  } = props

  // 构建矩阵映射表，支持通过索引或标签快速匹配单元格
  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>()
    for (const cell of cells) {
      map.set(`${cell.y}-${cell.x}`, cell)
    }
    return map
  }, [cells])

  const numCols = Math.max(xLabels.length, 1)

  return (
    <TooltipProvider delay={100}>
      <Card className={cn('h-full w-full', className)}>
        <CardHeader className="space-y-2 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
                {icon ? (
                  <A2uiDynamicIcon name={icon} size={16} className="size-4" />
                ) : (
                  <GridIcon className="size-4" aria-hidden />
                )}
              </div>
              <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            </div>

            {trendValue && (
              <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                {trend === 'up' && <ArrowUpRight className="size-3 shrink-0" aria-hidden />}
                {trendValue}
              </span>
            )}
          </div>

          {/* 图例 (Legend) */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className={cn('size-2 rounded-full shrink-0', INTENSITY_CLASSES[item.intensity])}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-1">
          <div className="space-y-2">
            {/* 矩阵主体：Y 轴标签 + 行单元格 */}
            {yLabels.map((yLabel, rowIdx) => (
              <div key={`row-${yLabel}-${rowIdx}`} className="flex items-center gap-3">
                {/* Y 轴文本标签 */}
                <div className="w-8 shrink-0 text-right font-mono text-xs font-medium text-muted-foreground">
                  {yLabel}
                </div>

                {/* 行内的单元格药丸条 */}
                <div
                  className="grid flex-1 gap-2"
                  style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
                >
                  {xLabels.map((xLabel, colIdx) => {
                    const cell =
                      cellMap.get(`${yLabel}-${xLabel}`) ||
                      cellMap.get(`${rowIdx}-${colIdx}`) ||
                      cellMap.get(`${yLabel}-${colIdx}`) ||
                      cellMap.get(`${rowIdx}-${xLabel}`)

                    const level = resolveIntensityLevel(cell?.intensity)
                    const tooltipData = cell?.tooltip

                    const cellButton = (
                      <div
                        tabIndex={0}
                        role="button"
                        aria-label={`${xLabel}, ${yLabel}: ${cell?.value || level}`}
                        className={cn(
                          'h-7 w-full rounded-md transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                          INTENSITY_CLASSES[level],
                          'hover:opacity-85'
                        )}
                      />
                    )

                    if (!tooltipData && !cell?.value) {
                      return <div key={`cell-${rowIdx}-${colIdx}`}>{cellButton}</div>
                    }

                    return (
                      <Tooltip key={`cell-${rowIdx}-${colIdx}`}>
                        <TooltipTrigger render={cellButton} />
                        <TooltipContent
                          side="top"
                          className="flex flex-col items-center justify-center rounded-md bg-foreground px-2.5 py-1.5 text-center text-background shadow-lg"
                        >
                          {tooltipData?.title && (
                            <span className="text-xs font-semibold">{tooltipData.title}</span>
                          )}
                          <span className="text-[10px] text-background/80">
                            {tooltipData?.subtitle || `${xLabel} · ${yLabel}`}
                          </span>
                          {(tooltipData?.value || cell?.value) && (
                            <span className="mt-0.5 font-mono text-xs font-bold text-background">
                              {tooltipData?.value || cell?.value}
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* X 轴底部标签 */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 shrink-0" aria-hidden />
              <div
                className="grid flex-1 gap-2"
                style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
              >
                {xLabels.map((xLabel) => (
                  <div
                    key={`col-${xLabel}`}
                    className="text-center font-mono text-xs font-medium text-muted-foreground"
                  >
                    {xLabel}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
