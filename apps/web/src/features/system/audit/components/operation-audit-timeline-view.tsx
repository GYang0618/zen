import {
  Badge,
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
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useMemo } from 'react'

import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'

import { AuditActorCell } from './audit-actor-cell'

import type { AuditLogItem } from '../api'

interface OperationAuditTimelineViewProps {
  items: AuditLogItem[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  activeLogId?: string | null
  onSelectLog?: (log: AuditLogItem) => void
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

export function OperationAuditTimelineView({
  items,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  activeLogId,
  onSelectLog
}: OperationAuditTimelineViewProps) {
  const groups = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const map = new Map<string, AuditLogItem[]>()
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
        <p className="text-sm">暂无审计操作轨迹</p>
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
              const isSelected = activeLogId === item.id
              const isSuccess = item.result === 'SUCCESS'
              const isDenied = item.result === 'DENIED'

              return (
                <TimelineItem key={item.id}>
                  <TimelineIndicator
                    className={`size-6 rounded-full border ${
                      isSuccess
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : isDenied
                          ? 'border-destructive/40 bg-destructive/10 text-destructive'
                          : 'border-destructive/40 bg-destructive/10 text-destructive'
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : isDenied ? (
                      <ShieldAlert className="size-3.5" />
                    ) : (
                      <AlertTriangle className="size-3.5" />
                    )}
                  </TimelineIndicator>
                  <TimelineConnector />

                  <TimelineContent className="pb-5">
                    <div
                      tabIndex={0}
                      role="button"
                      onClick={() => onSelectLog?.(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectLog?.(item)
                        }
                      }}
                      className={`group cursor-pointer rounded-xl border p-4 transition-all text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                          : 'border-border/80 bg-card/80 hover:border-border hover:bg-muted/40 hover:shadow-2xs'
                      }`}
                    >
                      <TimelineHeader className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <AuditActorCell
                            actor={item.actor}
                            actorType={item.actorType}
                            actorName={item.actorName}
                            actorDisplay={item.actorDisplay}
                            agentRunId={item.agentRunId}
                          />
                          <div className="space-y-0.5">
                            <TimelineTitle className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {item.title || item.actionLabel || item.action}
                            </TimelineTitle>
                            <span className="font-mono text-xs text-muted-foreground block">
                              {item.action}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isSuccess ? 'outline' : 'destructive'}
                            className={`text-xs ${
                              isSuccess
                                ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : ''
                            }`}
                          >
                            {isSuccess ? '成功' : isDenied ? '拒绝访问' : '失败'}
                          </Badge>
                          <TimelineTimestamp className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </TimelineTimestamp>
                        </div>
                      </TimelineHeader>

                      {(item.description || item.resource || item.ip) && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-sm text-muted-foreground">
                          <div className="truncate max-w-md text-foreground">
                            {item.description || item.resource || '-'}
                            {item.resourceId ? ` (${item.resourceId})` : ''}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground/80">
                            {item.ip ? `IP: ${item.ip}` : ''}
                            {item.endpoint ? ` · ${item.endpoint}` : ''}
                          </div>
                        </div>
                      )}
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
