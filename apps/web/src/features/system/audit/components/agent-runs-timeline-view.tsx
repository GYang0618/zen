import { formatCostMicros, formatDuration, formatTokens } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  Spinner,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineGroup,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineTimestamp,
  TimelineTitle
} from '@zen/ui'
import { AlertCircle, Bot, CheckCircle2, ChevronRight, Clock, Cpu, Loader2 } from 'lucide-react'
import { useMemo } from 'react'

import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'

import { getAgentRunStatusConfig } from './agent-runs-columns'
import { AuditActorCell } from './audit-actor-cell'

import type { AgentRunItem } from '../api'

interface AgentRunsTimelineViewProps {
  items: AgentRunItem[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  onViewDetail: (runId: string) => void
}

function formatDateGroup(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  } catch {
    return dateStr
  }
}

export function AgentRunsTimelineView({
  items,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  onViewDetail
}: AgentRunsTimelineViewProps) {
  const groups = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const map = new Map<string, AgentRunItem[]>()
    for (const item of sorted) {
      const groupKey = formatDateGroup(item.createdAt)
      const list = map.get(groupKey) ?? []
      list.push(item)
      map.set(groupKey, list)
    }
    return Array.from(map.entries()).map(([date, list]) => ({ date, list }))
  }, [items])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="flex h-64 flex-col items-center justify-center rounded-2xl border-dashed p-8 text-center text-muted-foreground">
        <Bot className="size-8 opacity-40 mb-2" />
        <p className="text-sm">暂无 Agent 任务执行记录</p>
      </Card>
    )
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-background/60 p-4 sm:p-6 shadow-2xs">
      <Timeline>
        {groups.map((group) => (
          <TimelineGroup key={group.date}>
            <TimelineItem>
              <TimelineIndicator className="size-3 border-2 border-primary bg-background" />
              <TimelineConnector />
              <TimelineContent className="pb-3">
                <TimelineTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.date}
                </TimelineTitle>
              </TimelineContent>
            </TimelineItem>

            {group.list.map((run) => {
              const statusConf = getAgentRunStatusConfig(run.status)
              const s = run.status?.toLowerCase()
              const isSuccess = s === 'succeeded' || s === 'completed'
              const isRunning = s === 'running'
              const isFailed = s === 'failed'

              return (
                <TimelineItem key={run.id}>
                  <TimelineIndicator
                    className={`size-6 rounded-full border ${
                      isSuccess
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : isRunning
                          ? 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : isFailed
                            ? 'border-destructive/40 bg-destructive/10 text-destructive'
                            : 'border-muted-foreground/40 bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : isRunning ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : isFailed ? (
                      <AlertCircle className="size-3.5" />
                    ) : (
                      <Clock className="size-3.5" />
                    )}
                  </TimelineIndicator>
                  <TimelineConnector />

                  <TimelineContent className="pb-5">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onViewDetail(run.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onViewDetail(run.id)
                        }
                      }}
                      className="group block rounded-xl border border-border/80 bg-card/80 p-4 hover:border-border hover:bg-muted/40 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <TimelineHeader className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {run.title || '智能助手会话'}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            ID: {run.id}
                          </span>
                          <Badge
                            variant={statusConf.variant}
                            className={`text-xs ${statusConf.className}`}
                          >
                            {statusConf.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <TimelineTimestamp className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(run.createdAt).toLocaleTimeString()}
                          </TimelineTimestamp>
                        </div>
                      </TimelineHeader>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-3 text-sm">
                        <div className="flex flex-wrap items-center gap-4">
                          <AuditActorCell
                            actor={run.user}
                            actorType="user"
                            identifier={run.userName || run.userId}
                          />

                          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
                            <Cpu className="size-3.5 text-purple-600 dark:text-purple-400" />
                            <span>{run.model || '模型未记录'}</span>
                            {run.provider && <span className="opacity-60">· {run.provider}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 font-mono text-xs">
                            <span className="text-foreground font-medium">
                              {run.usageReported === false
                                ? '用量未采集'
                                : `${formatTokens(run.totalTokens ?? 0)} Tokens`}
                            </span>
                            <span className="text-muted-foreground/60">·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {run.usageReported === false
                                ? '费用未采集'
                                : formatCostMicros(run.costMicros ?? 0)}
                            </span>
                            <span className="text-muted-foreground/60">·</span>
                            <span className="text-muted-foreground">
                              {formatDuration(run.durationMs ?? 0)}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground group-hover:text-primary gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewDetail(run.id)
                            }}
                          >
                            <span>详情</span>
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TimelineContent>
                </TimelineItem>
              )
            })}
          </TimelineGroup>
        ))}
      </Timeline>
      <InfiniteScrollSentinel
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore ?? (() => {})}
      />
    </div>
  )
}
