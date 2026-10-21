import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@zen/ui'
import { Activity, AlertTriangle, Bot, Clock } from 'lucide-react'

import type { ApiAccessStatsSummary } from '../api'

interface AccessStatsCardsProps {
  stats: ApiAccessStatsSummary | undefined
  isLoading: boolean
}

export function AccessStatsCards({ stats, isLoading }: AccessStatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-24" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const errorPercent = (stats.errorRate * 100).toFixed(2)
  const agentPercent = (stats.agentCallRatio * 100).toFixed(1)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总 API 流量</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">近 24 小时累计接口调用量</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">异常错误率</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.errorRate > 0.05 ? 'text-destructive' : ''}`}>
            {errorPercent}%
          </div>
          <p className="text-xs text-muted-foreground">
            累计失败 {stats.errorCount} 次 (4xx / 5xx)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">P95 响应耗时</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.p95LatencyMs} ms</div>
          <p className="text-xs text-muted-foreground">
            平均耗时 {Math.round(stats.avgLatencyMs)} ms
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agent 流量占比</CardTitle>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{agentPercent}%</div>
          <p className="text-xs text-muted-foreground">
            Agent 工具驱动调用 {stats.agentCallCount} 次
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
