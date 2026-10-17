import { formatCostMicros, formatDuration, formatTokens } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@zen/ui'
import {
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Coins,
  Cpu,
  Eye,
  RefreshCw,
  Users
} from 'lucide-react'
import { useState } from 'react'

import { useAgentRuns, useAgentStats } from '../queries'
import { AgentRunDetailSheet } from './agent-run-detail-sheet'

import type { AgentRunItem, AgentRunQuery } from '../api'

interface AgentUsageViewProps {
  onFilterOperationAudit?: (agentRunId: string) => void
}

export function AgentUsageView({ onFilterOperationAudit }: AgentUsageViewProps) {
  const [params, setParams] = useState<AgentRunQuery>({
    page: 1,
    pageSize: 15
  })
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAgentStats()
  const {
    data: runsData,
    isLoading: runsLoading,
    isFetching: runsFetching,
    refetch: refetchRuns
  } = useAgentRuns(params)

  const items = runsData?.items ?? []
  const total = runsData?.pagination.total ?? 0
  const totalPages = runsData?.pagination.totalPages ?? 1

  const handleRefresh = () => {
    void refetchStats()
    void refetchRuns()
  }

  const handleStatusChange = (val: string | null) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      status: !val || val === 'ALL' ? undefined : val
    }))
  }

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
              <div className="text-2xl font-bold">{formatTokens(stats.totalTokens)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              今日消耗 {stats ? formatTokens(stats.todayTokens) : '-'}
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
                {formatCostMicros(stats.totalCostMicros)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              今日成本 {stats ? formatCostMicros(stats.todayCostMicros) : '-'}
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
              <div className="text-2xl font-bold">{stats.totalRuns.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">
              今日触发 {stats ? stats.todayRuns : '-'} 次
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
              <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">已产生 AI 调用的独立用户数</p>
          </CardContent>
        </Card>
      </div>

      {/* 模型消耗分布卡片 */}
      {stats && stats.topModels.length > 0 && (
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
                const ratio = stats.totalTokens > 0 ? (m.tokens / stats.totalTokens) * 100 : 0
                return (
                  <div key={m.model} className="space-y-1.5 rounded-md border border-border p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-foreground">{m.model}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {formatCostMicros(m.costMicros)}
                      </span>
                    </div>
                    <Progress value={ratio} className="h-1.5" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {formatTokens(m.tokens)} ({ratio.toFixed(1)}%)
                      </span>
                      <span>调用 {m.callCount} 次</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent 任务执行流水表格 */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-foreground">任务运行流水</h3>
            <Select value={params.status ?? 'ALL'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="任务状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="RUNNING">执行中</SelectItem>
                <SelectItem value="COMPLETED">已完成</SelectItem>
                <SelectItem value="FAILED">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleRefresh}
            disabled={runsFetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${runsFetching ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">触发时间</TableHead>
                <TableHead className="w-40">发起用户</TableHead>
                <TableHead>任务标题 / 会话</TableHead>
                <TableHead className="w-36">使用模型</TableHead>
                <TableHead className="w-24">Tokens</TableHead>
                <TableHead className="w-24">预估费用</TableHead>
                <TableHead className="w-20">耗时</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Spinner />
                      <span>正在加载 Agent 任务流水...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-muted-foreground">
                    暂无 Agent 任务记录
                  </TableCell>
                </TableRow>
              ) : (
                items.map((run: AgentRunItem) => (
                  <TableRow key={run.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {run.userName || run.userId}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {run.title || '智能助手会话'}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          ID: {run.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {run.model}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium text-foreground">
                      {formatTokens(run.totalTokens)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-amber-600 dark:text-amber-400">
                      {formatCostMicros(run.costMicros)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDuration(run.durationMs)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          run.status === 'COMPLETED'
                            ? 'outline'
                            : run.status === 'FAILED'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {run.status === 'COMPLETED'
                          ? '成功'
                          : run.status === 'FAILED'
                            ? '失败'
                            : run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="查看分步调用详情"
                          onClick={() => setSelectedRunId(run.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {onFilterOperationAudit && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-purple-600 dark:text-purple-400"
                            title="查看该任务产生的写操作"
                            onClick={() => onFilterOperationAudit(run.id)}
                          >
                            审计
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页控制 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>共 {total} 笔 Agent 任务流水</div>
          <div className="flex items-center gap-2">
            <span>
              第 {params.page ?? 1} / {totalPages} 页
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={(params.page ?? 1) <= 1}
              onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={(params.page ?? 1) >= totalPages}
              onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AgentRunDetailSheet
        runId={selectedRunId}
        open={Boolean(selectedRunId)}
        onOpenChange={(open) => !open && setSelectedRunId(null)}
      />
    </div>
  )
}
