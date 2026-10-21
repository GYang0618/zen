import { Card, CardContent, CardHeader, CardTitle, cn } from '@zen/ui'
import { ArrowDownRight, ArrowUpRight, Users } from 'lucide-react'

import { A2uiDynamicIcon } from './icon'
import { OverflowText } from './overflow-text'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface BreakdownSegment {
  label: string
  value: number
  color?: string
}

export interface BreakdownItem {
  id?: string
  label: string
  initial?: string
  icon?: string
  avatar?: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  secondaryValue?: string
}

export interface BreakdownCardProps {
  title: string
  icon?: string
  totalValue?: string
  totalLabel?: string
  segments?: BreakdownSegment[]
  items: BreakdownItem[]
  columns?: {
    channelLabel?: string
    valueLabel?: string
    trendLabel?: string
  }
  className?: string
}

const DEFAULT_SEGMENT_COLORS = [
  'bg-foreground dark:bg-foreground',
  'bg-muted-foreground/60 dark:bg-muted-foreground/60',
  'bg-muted-foreground/30 dark:bg-muted-foreground/30',
  'bg-muted-foreground/20 dark:bg-muted-foreground/20'
]

const DEFAULT_LEGEND_DOT_COLORS = [
  'bg-foreground dark:bg-foreground',
  'bg-muted-foreground/60 dark:bg-muted-foreground/60',
  'bg-muted-foreground/30 dark:bg-muted-foreground/30',
  'bg-muted-foreground/20 dark:bg-muted-foreground/20'
]

export function BreakdownCard({ props }: RendererProps<BreakdownCardProps>) {
  const {
    title,
    icon,
    totalValue,
    totalLabel = '合计',
    segments = [],
    items = [],
    columns,
    className
  } = props

  const channelHeader = columns?.channelLabel ?? '渠道'
  const valueHeader = columns?.valueLabel ?? '数量'
  const trendHeader = columns?.trendLabel ?? '合计'

  // 计算分段进度条的总和与各段比例
  const totalSegmentValue = segments.reduce((sum, seg) => sum + (seg.value || 0), 0)

  return (
    <Card className={cn('@container/chart h-full w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
            {icon ? (
              <A2uiDynamicIcon name={icon} size={16} className="size-4" />
            ) : (
              <Users className="size-4" aria-hidden />
            )}
          </div>
          <CardTitle className="min-w-0 text-base font-semibold text-foreground">
            <OverflowText>{title}</OverflowText>
          </CardTitle>
        </div>

        {totalValue && (
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground @sm/chart:text-3xl">
              {totalValue}
            </span>
            {totalLabel && (
              <span className="text-xs font-normal text-muted-foreground @sm/chart:text-sm">
                {totalLabel}
              </span>
            )}
          </div>
        )}

        {/* 分段条形图 (Segmented bar) */}
        {segments.length > 0 && totalSegmentValue > 0 && (
          <div className="mt-3">
            <div
              className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-muted/40 p-0.5"
              role="progressbar"
              aria-label={title}
            >
              {segments.map((seg, idx) => {
                const pct = Math.max(2, (seg.value / totalSegmentValue) * 100)
                const colorClass =
                  seg.color || DEFAULT_SEGMENT_COLORS[idx % DEFAULT_SEGMENT_COLORS.length]
                return (
                  <div
                    key={`${seg.label}-${idx}`}
                    className={cn('h-full rounded-sm transition-all duration-300', colorClass)}
                    style={{ width: `${pct}%` }}
                    title={`${seg.label}: ${seg.value} (${pct.toFixed(1)}%)`}
                  />
                )
              })}
            </div>

            {/* 图例 (Legend) */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {segments.map((seg, idx) => {
                const dotColorClass =
                  seg.color || DEFAULT_LEGEND_DOT_COLORS[idx % DEFAULT_LEGEND_DOT_COLORS.length]
                return (
                  <div key={`legend-${seg.label}`} className="flex items-center gap-1.5">
                    <span className={cn('size-2 shrink-0 rounded-full', dotColorClass)} />
                    <span>{seg.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* 表格标题列 */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border/40 pb-2 text-xs font-medium text-muted-foreground">
          <span>{channelHeader}</span>
          <span className="min-w-[3.5rem] text-right">{valueHeader}</span>
          <span className="min-w-[4.5rem] text-right">{trendHeader}</span>
        </div>

        {/* 渠道/细分条目列表 */}
        <div className="divide-y divide-border/20">
          {items.map((item, idx) => {
            const initialLetter =
              item.initial || (item.label ? item.label.trim().charAt(0).toUpperCase() : '?')
            const isUp = item.trend === 'up'
            const isDown = item.trend === 'down'

            const trendColorClass = isUp
              ? 'text-emerald-600 dark:text-emerald-400'
              : isDown
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-muted-foreground'

            return (
              <div
                key={item.id || `${item.label}-${idx}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5 transition-colors hover:bg-muted/10"
              >
                {/* 渠道名称与首字母标识 */}
                <div className="flex min-w-0 items-center gap-2.5">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.label}
                      className="size-7 shrink-0 rounded-full object-cover"
                    />
                  ) : item.icon ? (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                      <A2uiDynamicIcon name={item.icon} size={14} className="size-3.5" />
                    </div>
                  ) : (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/60 text-xs font-semibold text-muted-foreground">
                      {initialLetter}
                    </div>
                  )}
                  <OverflowText className="text-sm font-medium text-foreground">
                    {item.label}
                  </OverflowText>
                </div>

                {/* 数值列 */}
                <div className="min-w-[3.5rem] text-right font-mono text-sm font-medium tabular-nums text-foreground">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </div>

                {/* 趋势/占比变化列 */}
                <div
                  className={cn(
                    'flex min-w-[4.5rem] items-center justify-end gap-1 font-mono text-sm font-medium tabular-nums',
                    trendColorClass
                  )}
                >
                  {isUp && <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />}
                  {isDown && <ArrowDownRight className="size-3.5 shrink-0" aria-hidden />}
                  <span>{item.trendValue || item.secondaryValue || '-'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
