import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator
} from '@zen/ui'
import {
  AlertTriangle,
  Bot,
  CalendarSync,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Hash,
  KeyRound,
  Layers,
  Mail,
  Phone,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  User,
  X
} from 'lucide-react'
import { useState } from 'react'

import { AuditDiffViewer } from '@/components/audit/audit-diff-viewer'

import { parseUserAgent } from '../utils/user-agent'

import type { AuditLogItem } from '../api'

interface OperationAuditSideOverviewProps {
  log: AuditLogItem | null
  onClose: () => void
  onNavigateAgentRun?: (runId: string) => void
}

function getResultBadge(result: AuditLogItem['result'], errorCode: string | null) {
  if (result === 'SUCCESS') {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="h-3 w-3" />
        执行成功
      </Badge>
    )
  }
  if (result === 'DENIED') {
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldAlert className="h-3 w-3" />
        拒绝访问 (403)
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      失败 {errorCode ? `(${errorCode})` : ''}
    </Badge>
  )
}

export function OperationAuditSideOverview({
  log,
  onClose,
  onNavigateAgentRun
}: OperationAuditSideOverviewProps) {
  const [copied, setCopied] = useState(false)

  if (!log) return null

  const handleCopyTrace = async () => {
    if (!log.traceId) return
    await navigator.clipboard.writeText(log.traceId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const actor = log.actor
  const isAgent = log.actorType === 'agent'
  const isSystem = log.actorType === 'system'
  const isAnonymous = log.actorType === 'anonymous'
  const isUser = !isAgent && !isSystem && !isAnonymous

  // 主体名称：优先真实姓名 -> 昵称 -> 用户名 -> 原始名称 -> 兜底
  const actorDisplayName =
    actor?.realName ||
    actor?.nickname ||
    actor?.username ||
    log.actorName ||
    log.actorDisplay ||
    '未知主体'

  // 副说明信息（如用户名/昵称/调度说明）
  const actorSecondary = isUser
    ? actor?.nickname && actor?.realName && actor.nickname !== actor.realName
      ? `昵称: ${actor.nickname} (@${actor.username})`
      : actor?.username
        ? `@${actor.username}`
        : '—'
    : isAgent
      ? log.agentToolName
        ? `工具调用: ${log.agentToolName}`
        : log.agentRunId
          ? `任务 ID: ${log.agentRunId}`
          : 'AI 智能体'
      : isSystem
        ? '系统内核进程'
        : '匿名外部请求'

  // 头像缩写字符
  const avatarFallback = isAgent ? 'AI' : isSystem ? 'SYS' : actorDisplayName.slice(0, 1) || 'U'

  const renderActorBadge = () => {
    if (isAgent) {
      return (
        <Badge
          variant="secondary"
          className="border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs"
        >
          AI Agent
        </Badge>
      )
    }
    if (isSystem) {
      return (
        <Badge variant="secondary" className="text-xs">
          系统内核
        </Badge>
      )
    }
    if (isAnonymous) {
      return (
        <Badge variant="outline" className="text-muted-foreground text-xs">
          匿名访客
        </Badge>
      )
    }
    return (
      <Badge
        variant="secondary"
        className="bg-green-300/50 dark:bg-green-900/40 text-xs font-normal"
      >
        操作人
      </Badge>
    )
  }

  const renderAvatar = () => {
    if (isAgent) {
      return (
        <Avatar className="size-14 border border-purple-500/30 bg-purple-500/10">
          <AvatarFallback className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Bot className="size-7" />
          </AvatarFallback>
        </Avatar>
      )
    }
    if (isSystem) {
      return (
        <Avatar className="size-14 border border-blue-500/30 bg-blue-500/10">
          <AvatarFallback className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Terminal className="size-7" />
          </AvatarFallback>
        </Avatar>
      )
    }
    if (isAnonymous) {
      return (
        <Avatar className="size-14 border bg-muted">
          <AvatarFallback className="text-muted-foreground">
            <User className="size-7" />
          </AvatarFallback>
        </Avatar>
      )
    }
    return (
      <Avatar className="size-14">
        <AvatarImage src={actor?.avatar ?? undefined} alt={actorDisplayName} />
        <AvatarFallback className="text-base font-semibold">{avatarFallback}</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <aside className="h-max space-y-6 rounded-3xl border border-border/60 bg-muted/30 p-5 xl:p-6">
      {/* 基本信息卡片（对齐组织详情基本信息规范） */}
      <Card className="rounded-2xl bg-background/80">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5 font-bold">
                <ShieldCheck className="size-5 shrink-0 text-primary" />
                <h2 className="truncate text-lg">基本信息</h2>
              </div>

              <Button variant="ghost" size="icon-sm" aria-label="关闭详情面板" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {log.title || log.actionLabel || log.action}
            {log.description ? ` · ${log.description}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-background/80">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground shrink-0">
                <Hash className="size-4" /> 操作标识
              </span>
              <span className="font-mono text-xs font-medium text-foreground">{log.action}</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground shrink-0">
                <Layers className="size-4" /> 关联目标
              </span>
              <span className="text-right truncate max-w-44 font-medium text-foreground">
                {log.resourceName || log.resource || '-'}
                {log.resourceId ? ` (${log.resourceId})` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground shrink-0">
                <CheckCircle2 className="size-4" /> 执行状态
              </span>
              {getResultBadge(log.result, log.errorCode)}
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground shrink-0">
                <CalendarSync className="size-4" /> 发生时间
              </span>
              <span className="font-medium text-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <Separator />

          {/* 主体基本信息（头像、昵称、邮箱、手机号等，对齐组织管理基本信息） */}
          <div>
            <Item className="mb-4 p-0">
              <ItemMedia>{renderAvatar()}</ItemMedia>
              <ItemContent>
                <ItemTitle className="text-lg leading-6 flex items-center gap-2 font-semibold">
                  <span className="truncate max-w-40">{actorDisplayName}</span>
                  {renderActorBadge()}
                </ItemTitle>
                <ItemDescription className="leading-5 text-xs text-muted-foreground truncate">
                  {actorSecondary}
                </ItemDescription>
              </ItemContent>
            </Item>

            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1 text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span className="font-mono text-foreground">{actor?.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1 text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                <span className="font-mono text-foreground">{actor?.phoneNumber || '—'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 网络与全链路追踪卡片 */}
      <Card className="rounded-2xl bg-background/80">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2 text-base font-semibold">
              <Globe className="size-4 shrink-0 text-muted-foreground" />
              <h2>网络与全链路追踪</h2>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 bg-background/80 text-sm">
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground shrink-0">
              <Globe className="size-4" /> 请求 IP
            </span>
            <span className="font-mono text-xs font-medium text-foreground truncate max-w-48">
              {log.ip || '-'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground shrink-0">
              <Server className="size-4" /> API 端点
            </span>
            <span className="font-mono text-xs font-medium text-foreground truncate max-w-48">
              {log.endpoint || '-'}
            </span>
          </div>

          {log.userAgent ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">客户端环境：</span>
                <span className="font-medium text-foreground">
                  {parseUserAgent(log.userAgent).label}
                </span>
              </div>
              <div
                className="rounded-lg bg-muted/50 p-2 font-mono text-[11px] text-muted-foreground break-all"
                title="原始 User-Agent 字符串"
              >
                {log.userAgent}
              </div>
            </div>
          ) : null}

          {log.traceId ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>全链路 Trace ID:</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs"
                  onClick={handleCopyTrace}
                >
                  <Copy className="size-3" />
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/40 p-2 font-mono text-xs text-foreground break-all">
                {log.traceId}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Agent 关联与审批链条 */}
      {log.agentRunId || log.agentToolName || log.agentApprovalId ? (
        <Card className="rounded-2xl border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2 text-base font-semibold text-purple-700 dark:text-purple-300">
                <Bot className="size-4" />
                <h2>Agent 调度与工具调用链</h2>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Separator className="bg-purple-500/20" />
            {log.agentRunId ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Agent 任务 ID:</span>
                  {onNavigateAgentRun ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 text-xs text-purple-600 dark:text-purple-400"
                      onClick={() => onNavigateAgentRun(log.agentRunId!)}
                    >
                      <ExternalLink className="size-3" />
                      深钻查看
                    </Button>
                  ) : null}
                </div>
                <div className="rounded-lg bg-purple-500/10 p-2 font-mono text-xs text-purple-900 dark:text-purple-200 break-all">
                  {log.agentRunId}
                </div>
              </div>
            ) : null}

            {log.agentToolName ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs">触发工具：</span>
                <Badge variant="outline" className="font-mono text-xs border-purple-500/30">
                  {log.agentToolName}
                </Badge>
              </div>
            ) : null}

            {log.agentApprovalId ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs">人工审批单：</span>
                <span className="font-mono text-xs text-foreground">{log.agentApprovalId}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* 变更数据快照 */}
      {log.diff ? (
        <Card className="rounded-2xl bg-background/80">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2 text-base font-semibold">
                <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                <h2>审计快照与变更比对</h2>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-background/80 pt-0">
            <Separator className="mb-4" />
            <AuditDiffViewer diff={log.diff} />
          </CardContent>
        </Card>
      ) : null}
    </aside>
  )
}
