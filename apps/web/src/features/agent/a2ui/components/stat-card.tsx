import { Card, CardContent, CardHeader, CardTitle, cn } from '@zen/ui'
import { Activity, ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, Users } from 'lucide-react'

import { A2uiDynamicIcon } from './icon'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export const STAT_CARD_ICONS = {
  dollar: DollarSign,
  users: Users,
  creditCard: CreditCard,
  activity: Activity
} as const

export type StatCardIconName = keyof typeof STAT_CARD_ICONS

export interface StatCardProps {
  title: string
  value: string
  description?: string
  icon?: StatCardIconName | string
  iconPosition?: 'left' | 'right'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  trendLabel?: string
  previousValue?: string
  previousLabel?: string
  period?: string
  sparkline?: number[] | Array<{ value: number; label?: string }>
  sparklineType?: 'bar' | 'line'
  className?: string
}

function resolveIcon(icon?: StatCardIconName | string): ReactNode {
  if (!icon) return null
  if (icon in STAT_CARD_ICONS) {
    const IconComp: LucideIcon = STAT_CARD_ICONS[icon as StatCardIconName]
    return <IconComp className="size-4 shrink-0" aria-hidden />
  }
  return <A2uiDynamicIcon name={icon} size={16} className="size-4 shrink-0" />
}

function normalizeSparklineData(
  sparkline?: number[] | Array<{ value: number; label?: string }>
): Array<{ value: number; label?: string }> | undefined {
  if (!sparkline || sparkline.length === 0) return undefined
  return sparkline.map((item) => (typeof item === 'number' ? { value: item } : item))
}

function StatCardSparkline({ data }: { data: Array<{ value: number; label?: string }> }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)

  return (
    <div role="img" className="flex h-8 w-full items-end gap-1.5 pt-2" aria-label="趋势图表">
      {data.map((item, idx) => {
        const heightPct = Math.max(12, Math.round((item.value / maxVal) * 100))
        const key = item.label ? `${item.label}-${idx}` : `spark-${idx}`
        return (
          <div
            key={key}
            className="flex-1 rounded-[2px] bg-muted-foreground/25 transition-colors hover:bg-muted-foreground/45"
            style={{ height: `${heightPct}%` }}
            title={item.label ? `${item.label}: ${item.value}` : String(item.value)}
          />
        )
      })}
    </div>
  )
}

function StatCardView(props: StatCardProps) {
  const iconNode = resolveIcon(props.icon)
  const isUp = props.trend === 'up'
  const isDown = props.trend === 'down'
  const hasPrevious = Boolean(props.previousValue || props.previousLabel)
  const isInlineIcon = props.iconPosition === 'left' || hasPrevious
  const sparklineData = normalizeSparklineData(props.sparkline)

  const trendColorClass = isUp
    ? 'text-emerald-600 dark:text-emerald-400'
    : isDown
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-muted-foreground'

  const displayTrendValue = props.trendValue || props.description

  return (
    <Card className={cn('h-full w-full', props.className)}>
      {isInlineIcon ? (
        <CardHeader className="space-y-1 pb-2">
          <div className="flex items-center gap-2">
            {iconNode && <div className="text-muted-foreground">{iconNode}</div>}
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {props.title}
            </CardTitle>
          </div>
          {hasPrevious && (
            <div className="text-xs text-muted-foreground">
              {props.previousValue && (
                <span className="font-medium text-foreground/85">{props.previousValue} </span>
              )}
              {props.previousLabel}
            </div>
          )}
        </CardHeader>
      ) : (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{props.title}</CardTitle>
          {iconNode && <div className="text-muted-foreground">{iconNode}</div>}
        </CardHeader>
      )}

      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {props.value}
        </div>

        {props.period && !hasPrevious && (
          <p className="mt-0.5 text-xs text-muted-foreground">{props.period}</p>
        )}

        {displayTrendValue && (
          <div
            className={cn('mt-1.5 flex items-center gap-1 text-sm font-medium', trendColorClass)}
          >
            {isUp && <ArrowUpRight className="size-4 shrink-0" aria-hidden />}
            {isDown && <ArrowDownRight className="size-4 shrink-0" aria-hidden />}
            <span>{displayTrendValue}</span>
            {props.trendLabel && (
              <span className="font-normal text-muted-foreground">{props.trendLabel}</span>
            )}
          </div>
        )}

        {sparklineData && <StatCardSparkline data={sparklineData} />}
      </CardContent>
    </Card>
  )
}

export function StatCard({ props }: RendererProps<StatCardProps>) {
  return <StatCardView {...props} />
}

/** 兼容旧版 Metric 契约（label → title），内部复用 StatCard */
export interface MetricProps {
  label: string
  value: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  trendLabel?: string
  description?: string
  icon?: StatCardIconName | string
  iconPosition?: 'left' | 'right'
  previousValue?: string
  previousLabel?: string
  period?: string
  sparkline?: number[] | Array<{ value: number; label?: string }>
}

export function Metric({ props }: RendererProps<MetricProps>) {
  return (
    <StatCardView
      title={props.label}
      value={props.value}
      description={props.description}
      icon={props.icon}
      iconPosition={props.iconPosition}
      trend={props.trend}
      trendValue={props.trendValue}
      trendLabel={props.trendLabel}
      previousValue={props.previousValue}
      previousLabel={props.previousLabel}
      period={props.period}
      sparkline={props.sparkline}
    />
  )
}
