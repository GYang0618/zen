import { Avatar, AvatarFallback, Badge, Button, Spinner } from '@zen/ui'
import { Bot, ChevronRight, Clock, ShieldAlert, Terminal, User } from 'lucide-react'
import { useState } from 'react'

import { AuditDetailSheet } from './audit-detail-sheet'

import type { AuditLogItem } from '@/features/system/audit/api'

interface AuditTimelineProps {
  items: AuditLogItem[]
  isLoading?: boolean
  className?: string
  emptyText?: string
  onNavigateAgentRun?: (runId: string) => void
}

function getActorIcon(actorType: AuditLogItem['actorType']) {
  switch (actorType) {
    case 'agent':
      return <Bot className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
    case 'system':
      return <Terminal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
    case 'anonymous':
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    default:
      return <User className="h-3.5 w-3.5 text-foreground" />
  }
}

export function AuditTimeline({
  items,
  isLoading = false,
  className,
  emptyText = '暂无审计轨迹',
  onNavigateAgentRun
}: AuditTimelineProps) {
  const [activeLog, setActiveLog] = useState<AuditLogItem | null>(null)

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (items.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">{emptyText}</div>
  }

  return (
    <>
      <div
        className={`relative space-y-4 before:absolute before:bottom-0 before:left-4 before:top-2 before:w-0.5 before:bg-border ${className ?? ''}`}
      >
        {items.map((item) => {
          const isFailed = item.result === 'FAILURE'
          const isDenied = item.result === 'DENIED'

          return (
            <div key={item.id} className="relative flex items-start gap-3 pl-8">
              {/* 时间线圆点 */}
              <div
                className={`absolute left-2.5 top-1.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 bg-background ${
                  isDenied || isFailed ? 'border-destructive bg-destructive/10' : 'border-primary'
                }`}
              />

              <div className="flex-1 rounded-lg border border-border bg-card p-3 shadow-xs transition-colors hover:border-border/80 hover:bg-muted/30">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {getActorIcon(item.actorType)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground">{item.actorDisplay}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {item.title || item.actionLabel}
                    </span>
                    {isDenied && (
                      <Badge variant="destructive" className="h-4 gap-0.5 px-1 text-[10px]">
                        <ShieldAlert className="h-2.5 w-2.5" />
                        权限拦截
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                {item.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                )}

                <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-1.5 text-xs">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {item.ip ? `IP: ${item.ip}` : ''}
                    {item.endpoint ? ` · ${item.endpoint}` : ''}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setActiveLog(item)}
                  >
                    查看详情
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <AuditDetailSheet
        log={activeLog}
        open={Boolean(activeLog)}
        onOpenChange={(open) => !open && setActiveLog(null)}
        onNavigateAgentRun={onNavigateAgentRun}
      />
    </>
  )
}
