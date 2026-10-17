import {
  Badge,
  Button,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@zen/ui'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  KeyRound,
  ShieldAlert,
  Terminal,
  User
} from 'lucide-react'
import { useState } from 'react'

import { AuditDiffViewer } from './audit-diff-viewer'

import type { AuditLogItem } from '@/features/system/audit/api'

interface AuditDetailSheetProps {
  log: AuditLogItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateAgentRun?: (runId: string) => void
}

function getActorBadge(actorType: AuditLogItem['actorType']) {
  switch (actorType) {
    case 'agent':
      return (
        <Badge
          variant="secondary"
          className="gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400"
        >
          <Bot className="h-3 w-3" />
          Agent
        </Badge>
      )
    case 'system':
      return (
        <Badge variant="secondary" className="gap-1">
          <Terminal className="h-3 w-3" />
          系统内核
        </Badge>
      )
    case 'anonymous':
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          匿名访客
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="gap-1 text-foreground">
          <User className="h-3 w-3" />
          用户
        </Badge>
      )
  }
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

export function AuditDetailSheet({
  log,
  open,
  onOpenChange,
  onNavigateAgentRun
}: AuditDetailSheetProps) {
  const [copied, setCopied] = useState(false)

  if (!log) return null

  const handleCopyTrace = async () => {
    if (!log.traceId) return
    await navigator.clipboard.writeText(log.traceId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            {getActorBadge(log.actorType)}
            {getResultBadge(log.result, log.errorCode)}
          </div>
          <SheetTitle className="text-xl font-bold">
            {log.title || log.actionLabel || log.action}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {log.description ||
              `在 ${new Date(log.createdAt).toLocaleString()} 由 ${log.actorDisplay} 执行`}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* 核心信息卡片 */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 text-xs">
              <div>
                <span className="text-muted-foreground">操作者：</span>
                <span className="ml-1 font-medium text-foreground">{log.actorDisplay}</span>
              </div>
              <div>
                <span className="text-muted-foreground">操作标识：</span>
                <span className="ml-1 font-mono text-foreground">{log.action}</span>
              </div>
              <div>
                <span className="text-muted-foreground">目标资源：</span>
                <span className="ml-1 text-foreground">
                  {log.resource || '-'} {log.resourceId ? `(${log.resourceId})` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">时间：</span>
                <span className="text-foreground">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* 网络与全链路追踪 */}
            <div className="space-y-3 rounded-lg border border-border p-4 text-xs">
              <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
                <Globe className="h-4 w-4 text-muted-foreground" />
                请求上下文与全链路追踪
              </h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">API 端点：</span>
                  <span className="ml-1 font-mono text-foreground">{log.endpoint || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">请求 IP：</span>
                  <span className="ml-1 font-mono text-foreground">{log.ip || '-'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">User-Agent：</span>
                  <span className="ml-1 break-all text-muted-foreground">
                    {log.userAgent || '-'}
                  </span>
                </div>
                {log.traceId && (
                  <div className="flex items-center justify-between rounded bg-muted/60 px-2 py-1.5 font-mono sm:col-span-2">
                    <span className="text-muted-foreground">Trace ID: {log.traceId}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs"
                      onClick={handleCopyTrace}
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? '已复制' : '复制'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Agent 关联与审批链条 */}
            {(log.agentRunId || log.agentToolName || log.agentApprovalId) && (
              <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 text-xs">
                <h4 className="flex items-center gap-1.5 font-semibold text-purple-700 dark:text-purple-300">
                  <Bot className="h-4 w-4" />
                  Agent 调度与工具调用链
                </h4>
                <div className="space-y-2">
                  {log.agentRunId && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Agent 任务 ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-foreground">{log.agentRunId}</span>
                        {onNavigateAgentRun && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 gap-1 text-xs text-purple-600 dark:text-purple-400"
                            onClick={() => onNavigateAgentRun(log.agentRunId!)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            深钻查看
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {log.agentToolName && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">触发工具：</span>
                      <Badge variant="outline" className="font-mono">
                        {log.agentToolName}
                      </Badge>
                    </div>
                  )}
                  {log.agentApprovalId && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">人工审批单：</span>
                      <span className="font-mono text-foreground">{log.agentApprovalId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 变更数据快照 */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                审计快照与变更比对
              </h4>
              <AuditDiffViewer diff={log.diff} />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
