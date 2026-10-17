import { formatCostMicros, formatDuration, formatTokens } from '@zen/shared'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@zen/ui'
import { AlertTriangle, Bot, Brain, CheckCircle2, Cpu, ShieldCheck, Zap } from 'lucide-react'

import { AuditTimeline } from '@/components/audit/audit-timeline'

import { useAgentRunDetail } from '../queries'

interface AgentRunDetailSheetProps {
  runId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentRunDetailSheet({ runId, open, onOpenChange }: AgentRunDetailSheetProps) {
  const { data: detail, isLoading } = useAgentRunDetail(runId ?? '', open)

  if (!runId) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-3xl">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400"
            >
              <Bot className="h-3.5 w-3.5" />
              Agent 执行任务
            </Badge>
            {detail && (
              <Badge
                variant={
                  detail.status === 'COMPLETED'
                    ? 'outline'
                    : detail.status === 'FAILED'
                      ? 'destructive'
                      : 'secondary'
                }
                className="gap-1"
              >
                {detail.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {detail.status}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-xl font-bold">{detail?.title || `任务: ${runId}`}</SheetTitle>
          <SheetDescription className="font-mono text-xs text-muted-foreground">
            ID: {runId} · 发起人：{detail?.userName || detail?.userId || '-'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4">
          {isLoading || !detail ? (
            <div className="flex h-60 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* 用量核心指标卡 */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card>
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-muted-foreground">总 Token 消耗</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold text-foreground">
                      {formatTokens(detail.totalTokens)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      输入 {formatTokens(detail.inputTokens)} · 输出{' '}
                      {formatTokens(detail.outputTokens)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-muted-foreground">预估费用</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {formatCostMicros(detail.costMicros)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">基于版本化模型定价表</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-muted-foreground">执行总耗时</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold text-foreground">
                      {formatDuration(detail.durationMs)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      共 {detail.stepCount} 轮模型推理
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-muted-foreground">主模型</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div
                      className="truncate text-sm font-bold text-foreground"
                      title={detail.model}
                    >
                      {detail.model}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      提供商：{detail.provider}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 思维链推理与缓存节省指标 */}
              {(detail.reasoningTokens > 0 || detail.cachedInputTokens > 0) && (
                <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                  {detail.reasoningTokens > 0 && (
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span>思考推理 Tokens：{formatTokens(detail.reasoningTokens)}</span>
                    </div>
                  )}
                  {detail.cachedInputTokens > 0 && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Zap className="h-4 w-4" />
                      <span>缓存命中：{formatTokens(detail.cachedInputTokens)} (节省开销)</span>
                    </div>
                  )}
                </div>
              )}

              {/* 模型调用逐步流水 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    逐步模型调用详情 ({detail.calls.length})
                  </h4>
                </div>

                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">步骤</TableHead>
                        <TableHead className="w-32">用途</TableHead>
                        <TableHead>模型</TableHead>
                        <TableHead className="w-24">Tokens</TableHead>
                        <TableHead className="w-24">费用</TableHead>
                        <TableHead className="w-20">耗时</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.calls.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="h-20 text-center text-xs text-muted-foreground"
                          >
                            无分步调用明细
                          </TableCell>
                        </TableRow>
                      ) : (
                        detail.calls.map((call) => (
                          <TableRow key={call.id} className="text-xs">
                            <TableCell className="font-mono text-muted-foreground">
                              #{call.stepIndex}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {call.purpose === 'AGENT_REASONING'
                                ? '核心思考推理'
                                : call.purpose === 'TOOL_CALL'
                                  ? '工具生成决策'
                                  : call.purpose === 'TITLE_GEN'
                                    ? '会话标题生成'
                                    : call.purpose}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {call.model}
                            </TableCell>
                            <TableCell className="font-mono text-foreground">
                              {formatTokens(call.inputTokens + call.outputTokens)}
                            </TableCell>
                            <TableCell className="font-mono text-amber-600 dark:text-amber-400">
                              {formatCostMicros(call.costMicros)}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {formatDuration(call.durationMs)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 关联业务操作审计轨迹 */}
              {detail.auditLogs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    该任务触发的业务操作与写变更 ({detail.auditLogs.length})
                  </h4>
                  <AuditTimeline items={detail.auditLogs} />
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
