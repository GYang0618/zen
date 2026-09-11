import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zen/ui'
import { TrendingDown, TrendingUp } from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  BarChart as RechartsBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface RowProps {
  children?: string[]
  gap?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export interface ColumnProps {
  children?: string[]
  gap?: number
}

export interface DashboardCardProps {
  title: string
  subtitle?: string
  child?: string
}

export interface MetricProps {
  label: string
  value: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export interface BarChartProps {
  title?: string
  data?: Array<{ label: string; value: number }>
  color?: string
}

export const commonRenderers = {
  Row: ({ props, children }: RendererProps<RowProps>) => {
    const childIds = Array.isArray(props.children) ? props.children : []
    const gap = props.gap ?? 12
    return (
      <div
        className="flex flex-wrap w-full"
        style={{
          gap: `${gap}px`,
          alignItems: props.align ?? 'stretch'
        }}
      >
        {childIds.map((id) => (
          <div key={id} className="flex-1 min-w-50">
            {children(id)}
          </div>
        ))}
      </div>
    )
  },

  Column: ({ props, children }: RendererProps<ColumnProps>) => {
    const childIds = Array.isArray(props.children) ? props.children : []
    const gap = props.gap ?? 16
    return (
      <div className="flex flex-col w-full" style={{ gap: `${gap}px` }}>
        {childIds.map((id) => (
          <div key={id} className="w-full">
            {children(id)}
          </div>
        ))}
      </div>
    )
  },

  DashboardCard: ({ props, children }: RendererProps<DashboardCardProps>) => {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{props.title}</CardTitle>
          {props.subtitle && (
            <CardDescription className="text-xs">{props.subtitle}</CardDescription>
          )}
        </CardHeader>
        {props.child && <CardContent>{children(props.child)}</CardContent>}
      </Card>
    )
  },

  Metric: ({ props }: RendererProps<MetricProps>) => {
    const isUp = props.trend === 'up'
    const isDown = props.trend === 'down'

    return (
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 shadow-xs">
        <span className="text-xs font-medium text-muted-foreground">{props.label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground">{props.value}</span>
          {props.trend && props.trendValue && (
            <span
              className={`flex items-center text-xs font-medium ${
                isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-muted-foreground'
              }`}
            >
              {isUp && <TrendingUp className="mr-0.5 size-3" />}
              {isDown && <TrendingDown className="mr-0.5 size-3" />}
              {props.trendValue}
            </span>
          )}
        </div>
      </div>
    )
  },

  BarChart: ({ props }: RendererProps<BarChartProps>) => {
    const data = props.data ?? []
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs w-full">
        {props.title && (
          <h4 className="text-sm font-semibold text-foreground mb-3">{props.title}</h4>
        )}
        <div className="h-76 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBar data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="value" fill={props.color || 'var(--primary)'} radius={[4, 4, 0, 0]} />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }
}
