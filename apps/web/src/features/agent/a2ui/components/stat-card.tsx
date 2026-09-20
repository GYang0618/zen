import { Card, CardContent, CardHeader, CardTitle } from '@zen/ui'
import { Activity, CreditCard, DollarSign, TrendingDown, TrendingUp, Users } from 'lucide-react'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { LucideIcon } from 'lucide-react'

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
  icon?: StatCardIconName
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

function resolveDescription(props: StatCardProps): string | undefined {
  if (props.description) return props.description
  if (props.trendValue) return props.trendValue
  return undefined
}

function resolveIcon(icon?: StatCardIconName): LucideIcon | undefined {
  if (!icon) return undefined
  return STAT_CARD_ICONS[icon]
}

function StatCardView(props: StatCardProps) {
  const Icon = resolveIcon(props.icon)
  const description = resolveDescription(props)
  const isUp = props.trend === 'up'
  const isDown = props.trend === 'down'

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{props.title}</CardTitle>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{props.value}</div>
        {description && (
          <p
            className={`mt-1 flex items-center text-xs ${
              isUp
                ? 'text-emerald-600 dark:text-emerald-400'
                : isDown
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-muted-foreground'
            }`}
          >
            {isUp && <TrendingUp className="mr-1 size-3" aria-hidden />}
            {isDown && <TrendingDown className="mr-1 size-3" aria-hidden />}
            {description}
          </p>
        )}
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
  description?: string
  icon?: StatCardIconName
}

export function Metric({ props }: RendererProps<MetricProps>) {
  return (
    <StatCardView
      title={props.label}
      value={props.value}
      description={props.description}
      icon={props.icon}
      trend={props.trend}
      trendValue={props.trendValue}
    />
  )
}
