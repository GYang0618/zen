import { useParams, useRouter } from '@tanstack/react-router'
import { formatCostMicros, formatDuration, formatTokens } from '@zen/shared'
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineTimestamp,
  toast
} from '@zen/ui'
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Cpu,
  Info,
  Layers,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Zap
} from 'lucide-react'
import { useState } from 'react'

import { AuditDiffViewer } from '@/components/audit/audit-diff-viewer'
import { EmptyState } from '@/components/empty-state'
import { AppHeader, Main } from '@/components/layouts'

import { getAgentRunStatusConfig } from './components/agent-runs-columns'
import { AuditActorCell } from './components/audit-actor-cell'
import { useAgentRunDetail } from './queries'

export function AgentRunDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { history } = useRouter()
  const { data: detail, isLoading, isError, error, refetch, isFetching } = useAgentRunDetail(id)
  const [copiedId, setCopiedId] = useState(false)
  const [openDiffMap, setOpenDiffMap] = useState<Record<string, boolean>>({})

  const handleCopyId = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(true)
      toast.add({ title: '已复制任务 ID', type: 'success' })
      setTimeout(() => setCopiedId(false), 2000)
    } catch {
      toast.add({ title: '复制失败', type: 'error' })
    }
  }

  const toggleDiff = (logId: string) => {
    setOpenDiffMap((prev) => ({
      ...prev,
      [logId]: !prev[logId]
    }))
  }

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 gap-4 @5xl:grid-cols-3">
            <Skeleton className="h-96 @5xl:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </Main>
      </>
    )
  }

  if (isError || !detail) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col gap-4">
          <EmptyState
            title="未能获取任务详情"
            description={error instanceof Error ? error.message : '该任务记录不存在或无权访问'}
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => history.go(-1)}>
                  返回上一页
                </Button>
                <Button variant="outline" onClick={() => void refetch()}>
                  重试
                </Button>
              </div>
            }
          />
        </Main>
      </>
    )
  }

  const statusConf = getAgentRunStatusConfig(detail.status)
  const calls = detail.calls ?? []
  const auditLogs = detail.auditLogs ?? []
  const reasoningTokens = detail.reasoningTokens ?? 0
  const cachedInputTokens = detail.cachedInputTokens ?? 0

  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4">
        {/* 顶部 PageHeader 对齐用户/角色/组织详情页风格 */}
        <PageHeader size="lg">
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            aria-label="返回上一页"
            onClick={() => history.go(-1)}
          >
            <ArrowLeft className="size-5" />
          </Button>

          <PageHeaderMedia>
            <Bot />
          </PageHeaderMedia>

          <PageHeaderContent>
            <PageHeaderTitle as="h1" className="inline-flex flex-wrap items-center gap-3">
              <span>{detail.title || '智能助手会话'}</span>
            </PageHeaderTitle>
            <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={statusConf.variant} className={`text-xs ${statusConf.className}`}>
                {statusConf.label}
              </Badge>
              <span>·</span>
              <span className="font-mono text-xs text-muted-foreground">
                模型：{detail.model || '未记录'} ({detail.provider || '未记录'})
              </span>
              <span>·</span>
              <span className="text-xs text-muted-foreground">
                耗时：{formatDuration(detail.durationMs ?? 0)}
              </span>
              <span>·</span>
              <span className="text-xs text-muted-foreground">
                触发时间：{new Date(detail.createdAt).toLocaleString()}
              </span>
            </PageHeaderDescription>
          </PageHeaderContent>

          <PageHeaderActions className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </PageHeaderActions>
        </PageHeader>

        {/* 双栏布局：左侧主区域展示指标、模型调用流水及关联审计轨迹，右侧侧边栏展示发起人与环境 */}
        <div className="flex flex-col gap-4 @5xl/content:flex-row">
          {/* 左侧主体 */}
          <section className="flex min-w-0 flex-1 flex-col gap-4">
            {/* 核心指标卡组 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">总 Token 消耗</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <div className="text-xl font-semibold text-foreground">
                    {detail.usageReported === false
                      ? '未采集'
                      : formatTokens(detail.totalTokens ?? 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {detail.usageReported === false
                      ? '没有可用于回溯的模型调用记录'
                      : `输入 ${formatTokens(detail.inputTokens ?? 0)} · 输出 ${formatTokens(detail.outputTokens ?? 0)}`}
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">预估总费用</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <div className="text-xl font-semibold text-foreground">
                    {detail.usageReported === false
                      ? '未采集'
                      : formatCostMicros(detail.costMicros ?? 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {detail.usageReported === false
                      ? '缺少 Token 数据，无法估算'
                      : '根据模型定价表估算'}
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">推理总轮数</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <div className="text-xl font-semibold text-foreground">
                    {detail.stepCount ?? calls.length ?? 0} 轮
                  </div>
                  <div className="text-xs text-muted-foreground">
                    共调用 {calls.length} 次底层模型
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">执行总耗时</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <div className="text-xl font-semibold text-foreground">
                    {formatDuration(detail.durationMs ?? 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {detail.endedAt ? '任务已终态结转' : '任务运行中'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {detail.usageReported === false && (
              <Alert>
                <Info />
                <AlertDescription>
                  此任务没有成功上报模型用量，因此 Token
                  与费用不可恢复。修复上报接口后新任务会记录明细。
                </AlertDescription>
              </Alert>
            )}

            {/* 思维链推理与缓存节省效果 */}
            {(reasoningTokens > 0 || cachedInputTokens > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {reasoningTokens > 0 && (
                  <Badge variant="secondary">
                    <Brain data-icon="inline-start" />
                    <span>思考推理 Tokens：{formatTokens(reasoningTokens)}</span>
                  </Badge>
                )}
                {cachedInputTokens > 0 && (
                  <Badge variant="secondary">
                    <Zap data-icon="inline-start" />
                    <span>Prompt 缓存命中：{formatTokens(cachedInputTokens)} (已大幅节省开销)</span>
                  </Badge>
                )}
              </div>
            )}

            {/* 分步模型调用流水表格 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="size-4 text-primary" />
                    分步模型调用流水
                  </CardTitle>
                  <CardDescription>
                    该 Agent 任务执行生命周期内触发的每一轮大语言模型调用细节
                  </CardDescription>
                </div>
                <Badge variant="secondary">{calls.length} 次调用</Badge>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">轮次</TableHead>
                        <TableHead className="w-36">调用目的</TableHead>
                        <TableHead>模型及提供商</TableHead>
                        <TableHead className="w-28">Token 消耗</TableHead>
                        <TableHead className="w-24">费用</TableHead>
                        <TableHead className="w-20">耗时</TableHead>
                        <TableHead className="w-20 text-right">状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-28 text-center text-sm text-muted-foreground"
                          >
                            {detail.usageReported === false
                              ? '未采集到模型调用明细，历史用量无法回溯'
                              : '本次任务没有模型调用明细'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        calls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell className="font-mono text-muted-foreground font-medium">
                              #{call.stepIndex}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {call.purpose === 'AGENT_REASONING'
                                ? '核心思考推理'
                                : call.purpose === 'TOOL_CALL'
                                  ? '工具调用决策'
                                  : call.purpose === 'TITLE_GEN'
                                    ? '会话标题生成'
                                    : call.purpose}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              <span>{call.model}</span>
                              {call.provider && (
                                <span className="opacity-60"> · {call.provider}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-foreground">
                              {formatTokens((call.inputTokens ?? 0) + (call.outputTokens ?? 0))}
                              <span className="block text-[10px] text-muted-foreground">
                                入 {formatTokens(call.inputTokens ?? 0)} · 出{' '}
                                {formatTokens(call.outputTokens ?? 0)}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {formatCostMicros(call.costMicros ?? 0)}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {formatDuration(call.durationMs ?? 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={call.status === 'SUCCESS' ? 'outline' : 'secondary'}>
                                {call.status === 'SUCCESS' ? '成功' : call.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 该流水的审计轨迹（就地时间线展示，无需跳转） */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    任务触发的业务操作审计轨迹
                  </CardTitle>
                  <CardDescription>
                    该任务执行期间通过工具函数产生的真实业务写变更与权限审计事件
                  </CardDescription>
                </div>
                <Badge variant={auditLogs.length > 0 ? 'outline' : 'secondary'}>
                  {auditLogs.length} 条审计事件
                </Badge>
              </CardHeader>

              <CardContent>
                {auditLogs.length === 0 ? (
                  <Empty className="min-h-36 border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Shield />
                      </EmptyMedia>
                      <EmptyTitle>暂无业务操作审计记录</EmptyTitle>
                      <EmptyDescription>
                        本次 Agent 任务未触发业务写操作或安全拦截事件
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div>
                    <Timeline>
                      {auditLogs.map((log) => {
                        const isSuccess = log.result === 'SUCCESS'
                        const isDenied = log.result === 'DENIED'
                        const hasDiff = Boolean(log.diff)
                        const isDiffOpen = Boolean(openDiffMap[log.id])

                        return (
                          <TimelineItem key={log.id}>
                            <TimelineIndicator>
                              {isSuccess ? (
                                <CheckCircle2 className="size-3.5" />
                              ) : isDenied ? (
                                <ShieldAlert className="size-3.5" />
                              ) : (
                                <AlertCircle className="size-3.5" />
                              )}
                            </TimelineIndicator>
                            <TimelineConnector />

                            <TimelineContent className="pb-4">
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-sm text-foreground">
                                      {log.title || log.actionLabel || log.action}
                                    </span>
                                    <Badge
                                      variant={
                                        isSuccess
                                          ? 'outline'
                                          : isDenied
                                            ? 'secondary'
                                            : 'destructive'
                                      }
                                    >
                                      {isSuccess ? '成功' : isDenied ? '权限拦截' : '执行失败'}
                                    </Badge>
                                    {log.agentToolName && (
                                      <Badge variant="outline" className="font-mono">
                                        工具: {log.agentToolName}
                                      </Badge>
                                    )}
                                  </div>

                                  <TimelineTimestamp className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                  </TimelineTimestamp>
                                </div>

                                {log.description && (
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    {log.description}
                                  </p>
                                )}

                                <Separator />
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                                    {log.resource && (
                                      <span>
                                        资源: {log.resource}
                                        {log.resourceId ? ` (#${log.resourceId})` : ''}
                                      </span>
                                    )}
                                    {log.ip && <span>IP: {log.ip}</span>}
                                    {log.endpoint && <span>接口: {log.endpoint}</span>}
                                  </div>

                                  {hasDiff && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => toggleDiff(log.id)}
                                    >
                                      <span>
                                        {isDiffOpen ? '收起变更明细' : '查看数据变更快照'}
                                      </span>
                                      <ChevronDown
                                        data-icon="inline-end"
                                        className={`transition-transform ${
                                          isDiffOpen ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </Button>
                                  )}
                                </div>

                                {hasDiff && isDiffOpen && (
                                  <div className="rounded-md bg-muted p-3">
                                    <AuditDiffViewer diff={log.diff} />
                                  </div>
                                )}
                              </div>
                            </TimelineContent>
                          </TimelineItem>
                        )
                      })}
                    </Timeline>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 右侧侧边栏 */}
          <aside className="flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed bg-muted/35 p-3 @5xl/content:w-90 @5xl/content:self-start">
            {/* 发起人信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-primary" />
                  发起人信息
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm">
                <AuditActorCell
                  actor={detail.user}
                  actorType="user"
                  identifier={detail.userName || detail.userId}
                />

                <Separator />
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">用户标识 (ID)</span>
                    <span className="font-mono text-foreground font-medium truncate max-w-[150px]">
                      {detail.userId}
                    </span>
                  </div>
                  {detail.user?.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">电子邮箱</span>
                      <span className="text-foreground truncate max-w-[150px]">
                        {detail.user.email}
                      </span>
                    </div>
                  )}
                  {detail.user?.phoneNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">联系电话</span>
                      <span className="text-foreground">{detail.user.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 运行时环境与任务元数据卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers className="size-4 text-primary" />
                  任务元数据
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">任务全局 ID (Run ID)</span>
                  <div className="flex items-center justify-between rounded-md bg-muted/60 p-2 font-mono text-[11px] text-foreground">
                    <span className="truncate">{detail.id}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyId(detail.id)}
                    >
                      {copiedId ? <Check /> : <Copy />}
                    </Button>
                  </div>
                </div>

                {detail.threadId && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">关联会话 (Thread ID)</span>
                    <div className="rounded-md bg-muted/60 p-2 font-mono text-[11px] text-foreground truncate">
                      {detail.threadId}
                    </div>
                  </div>
                )}

                <Separator />
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">提供商 (Provider)</span>
                    <span className="font-mono text-foreground font-medium uppercase">
                      {detail.provider || 'openai'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">执行状态</span>
                    <Badge
                      variant={statusConf.variant}
                      className={`text-[10px] ${statusConf.className}`}
                    >
                      {statusConf.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">创建时间</span>
                    <span className="font-mono text-foreground">
                      {new Date(detail.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {detail.endedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">结束时间</span>
                      <span className="font-mono text-foreground">
                        {new Date(detail.endedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </Main>
    </>
  )
}
