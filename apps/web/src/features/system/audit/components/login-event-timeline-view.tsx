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
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldAlert
} from 'lucide-react'
import { useMemo } from 'react'

import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'

import { parseUserAgent } from '../utils/user-agent'
import { AuditActorCell } from './audit-actor-cell'

import type { LoginEventItem } from '../api'

interface LoginEventTimelineViewProps {
  items: LoginEventItem[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
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

function getEventBadge(event: string) {
  if (event.includes('logout')) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground text-xs whitespace-nowrap">
        <LogOut className="size-3" />
        账号登出
      </Badge>
    )
  }
  if (event.includes('refresh')) {
    return (
      <Badge variant="secondary" className="gap-1 text-xs whitespace-nowrap">
        <RefreshCw className="size-3" />
        Token 刷新
      </Badge>
    )
  }
  if (event.includes('locked')) {
    return (
      <Badge variant="destructive" className="gap-1 text-xs whitespace-nowrap">
        <ShieldAlert className="size-3" />
        账号锁定
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-foreground text-xs whitespace-nowrap">
      <LogIn className="size-3" />
      用户登录
    </Badge>
  )
}

export function LoginEventTimelineView({
  items,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore
}: LoginEventTimelineViewProps) {
  const groups = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const map = new Map<string, LoginEventItem[]>()
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
        <p className="text-sm">暂无登录事件历史</p>
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
              const isSuccess = item.success
              const parsedUa = parseUserAgent(item.userAgent)

              return (
                <TimelineItem key={item.id}>
                  <TimelineIndicator
                    className={`size-6 rounded-full border ${
                      isSuccess
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-destructive/40 bg-destructive/10 text-destructive'
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <AlertTriangle className="size-3.5" />
                    )}
                  </TimelineIndicator>
                  <TimelineConnector />

                  <TimelineContent className="pb-5">
                    <div className="rounded-xl border border-border/80 bg-card/80 p-4 hover:border-border hover:bg-muted/40 transition-all text-left">
                      <TimelineHeader className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <AuditActorCell
                            actor={item.user}
                            identifier={item.identifier}
                            actorType="user"
                          />
                          <div>{getEventBadge(item.event)}</div>
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
                            {isSuccess ? '验证通过' : '认证失败'}
                          </Badge>
                          <TimelineTimestamp className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </TimelineTimestamp>
                        </div>
                      </TimelineHeader>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Globe className="size-3.5 opacity-60" />
                          <span className="font-mono text-foreground font-medium text-sm">
                            {item.ip || '-'}
                          </span>
                          <span className="text-muted-foreground/60">·</span>
                          <span
                            className="font-medium text-foreground cursor-help text-sm"
                            title={parsedUa.raw || undefined}
                          >
                            {parsedUa.label}
                          </span>
                        </div>

                        {item.reason && (
                          <div className="text-destructive font-medium text-sm">
                            原因: {item.reason}
                          </div>
                        )}
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
