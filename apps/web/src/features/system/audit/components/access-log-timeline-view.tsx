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
import { AlertCircle, CheckCircle2, ExternalLink, Globe } from 'lucide-react'
import { useMemo } from 'react'

import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'

import { parseUserAgent } from '../utils/user-agent'
import { AuditActorCell } from './audit-actor-cell'

import type { ApiAccessLogItem } from '../api'

interface AccessLogTimelineViewProps {
  items: ApiAccessLogItem[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  onNavigateAgentRun?: (runId: string) => void
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

function getMethodBadge(method: string) {
  const m = method.toUpperCase()
  if (m === 'GET') {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 font-mono text-[11px] text-blue-600 dark:text-blue-400 whitespace-nowrap"
      >
        GET
      </Badge>
    )
  }
  if (m === 'POST') {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
      >
        POST
      </Badge>
    )
  }
  if (m === 'PUT' || m === 'PATCH') {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 font-mono text-[11px] text-amber-600 dark:text-amber-400 whitespace-nowrap"
      >
        {m}
      </Badge>
    )
  }
  if (m === 'DELETE') {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 font-mono text-[11px] text-destructive whitespace-nowrap"
      >
        DELETE
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="font-mono text-[11px] whitespace-nowrap">
      {m}
    </Badge>
  )
}

export function AccessLogTimelineView({
  items,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  onNavigateAgentRun
}: AccessLogTimelineViewProps) {
  const groups = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const map = new Map<string, ApiAccessLogItem[]>()
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
        <p className="text-sm">暂无接口访问记录</p>
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

            {group.list.map((item) => {
              const isError = item.status >= 400
              const isSlow = item.latencyMs >= 1000
              const parsedUa = parseUserAgent(item.userAgent)

              return (
                <TimelineItem key={item.id}>
                  <TimelineIndicator
                    className={`size-6 rounded-full border ${
                      !isError
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-destructive/40 bg-destructive/10 text-destructive'
                    }`}
                  >
                    {!isError ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <AlertCircle className="size-3.5" />
                    )}
                  </TimelineIndicator>
                  <TimelineConnector />

                  <TimelineContent className="pb-5">
                    <div className="rounded-xl border border-border/80 bg-card/80 p-4 hover:border-border hover:bg-muted/40 transition-all text-left">
                      <TimelineHeader className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {getMethodBadge(item.method)}
                          <span className="font-mono text-sm font-medium text-foreground">
                            {item.route}
                          </span>
                          {item.title && (
                            <span className="text-xs text-muted-foreground">· {item.title}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isError ? 'destructive' : 'outline'}
                            className={`font-mono text-xs ${
                              !isError
                                ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : ''
                            }`}
                          >
                            {item.status}
                          </Badge>
                          <span
                            className={`font-mono text-sm ${
                              isSlow
                                ? 'font-bold text-amber-600 dark:text-amber-400'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {item.latencyMs} ms
                          </span>
                          <TimelineTimestamp className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </TimelineTimestamp>
                        </div>
                      </TimelineHeader>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-2.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <AuditActorCell
                            actor={item.user}
                            actorType={
                              item.callerType === 'AGENT'
                                ? 'agent'
                                : item.callerType === 'ANONYMOUS'
                                  ? 'anonymous'
                                  : 'user'
                            }
                            agentRunId={item.agentRunId}
                            agentToolName={item.agentToolName}
                            identifier={item.userId}
                          />
                          {item.agentRunId && onNavigateAgentRun && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 gap-1 px-1.5 text-xs text-purple-600 dark:text-purple-400"
                              onClick={() => onNavigateAgentRun(item.agentRunId!)}
                            >
                              <span>查看 Agent</span>
                              <ExternalLink className="size-3" />
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Globe className="size-3.5 opacity-60" />
                          <span className="font-mono text-sm text-foreground">
                            {item.ip || '-'}
                          </span>
                          <span className="text-muted-foreground/60">·</span>
                          <span
                            className="font-medium text-sm text-foreground cursor-help"
                            title={parsedUa.raw || undefined}
                          >
                            {parsedUa.label}
                          </span>
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
