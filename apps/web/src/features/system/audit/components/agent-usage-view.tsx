import { formatCostMicros, formatTokens } from '@zen/shared'
import { Card, CardContent, CardHeader, CardTitle, Progress, Skeleton } from '@zen/ui'
import { Bot, BrainCircuit, Coins, Cpu, Users } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

import { useAgentStats } from '../queries'
import { AgentRunsTable } from './agent-runs-table'

interface AgentUsageViewProps {
  onViewDetail: (runId: string) => void
  onRefetchReady?: (refetch: () => void) => void
}

export function AgentUsageView({ onViewDetail, onRefetchReady }: AgentUsageViewProps) {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAgentStats()
  const tableRefetchRef = useRef<(() => void) | null>(null)

  const handleTableRefetchReady = useCallback((refetch: () => void) => {
    tableRefetchRef.current = refetch
  }, [])

  useEffect(() => {
    onRefetchReady?.(() => {
      void refetchStats()
      tableRefetchRef.current?.()
    })
  }, [onRefetchReady, refetchStats])

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计 Token 用量</CardTitle>
            <BrainCircuit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            {statsLoading || !stats ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold">{formatTokens(stats.totalTokens ?? 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              今日消耗 {stats ? formatTokens(stats.todayTokens ?? 0) : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计 AI 成本</CardTitle>
            <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            {statsLoading || !stats ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatCostMicros(stats.totalCostMicros ?? 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              今日成本 {stats ? formatCostMicros(stats.todayCostMicros ?? 0) : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent 任务总数</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading || !stats ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold">{(stats.totalRuns ?? 0).toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">
              今日触发 {stats ? (stats.todayRuns ?? 0) : '-'} 次
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃使用用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading || !stats ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-2xl font-bold">{(stats.activeUsers ?? 0).toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">已产生 AI 调用的独立用户数</p>
          </CardContent>
        </Card>
      </div>

      {/* 模型消耗分布卡片 */}
      {stats?.topModels && stats.topModels.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              主流模型消耗分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.topModels.map((m) => {
                const total = stats.totalTokens ?? 0
                const ratio = total > 0 ? ((m.tokens ?? 0) / total) * 100 : 0
                return (
                  <div key={m.model} className="space-y-1.5 rounded-md border border-border p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-foreground">{m.model}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {formatCostMicros(m.costMicros ?? 0)}
                      </span>
                    </div>
                    <Progress value={ratio} className="h-1.5" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {formatTokens(m.tokens ?? 0)} ({ratio.toFixed(1)}%)
                      </span>
                      <span>调用 {m.callCount ?? 0} 次</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent 任务执行流水（双视图支持） */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">任务运行流水</h3>
        <AgentRunsTable onViewDetail={onViewDetail} onRefetchReady={handleTableRefetchReady} />
      </div>
    </div>
  )
}
