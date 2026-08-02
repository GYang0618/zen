import { Badge, Button, Card, CardContent, cn, Skeleton } from '@zen/ui'
import { MonitorSmartphone } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components'
import {
  useRevokeOtherSessionsMutation,
  useRevokeSessionMutation,
  useSettingsSessionsQuery
} from '@/features/settings/queries'
import { EmptyState } from '@/features/system/config/components'

import type { AuthSessionItem } from '@/features/auth/api'

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return '未知设备'
  if (/Mobile|Android|iPhone/i.test(userAgent)) return '移动设备'
  if (/Mac|Windows|Linux/i.test(userAgent)) return '桌面设备'
  return '其他设备'
}

export function SessionsPanel() {
  const { data: sessions, isLoading } = useSettingsSessionsQuery()
  const revokeOne = useRevokeSessionMutation()
  const revokeOthers = useRevokeOtherSessionsMutation()
  const [pendingSession, setPendingSession] = useState<AuthSessionItem | null>(null)

  return (
    <>
      <Card size="sm" className="gap-0 py-0">
        <div className="flex flex-col justify-between gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold">活跃登录会话</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              展示当前已登录您账号的终端设备，若发现异常可快速下线。
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 self-start text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-auto"
            disabled={revokeOthers.isPending || (sessions?.length ?? 0) <= 1}
            onClick={() => revokeOthers.mutate()}
          >
            下线其他所有设备
          </Button>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-5/6" />
            </div>
          ) : (sessions?.length ?? 0) === 0 ? (
            <EmptyState
              icon={MonitorSmartphone}
              title="暂无活跃会话"
              description="登录后将在此显示设备与 IP 信息"
              compact
            />
          ) : (
            <ul className="divide-y">
              {sessions?.map((session) => {
                const isCurrent = Boolean(session.current)
                return (
                  <li
                    key={session.id}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors',
                      isCurrent ? 'bg-primary/5' : 'hover:bg-muted/40'
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                          isCurrent
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <MonitorSmartphone className="size-4" aria-hidden />
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {deviceLabel(session.userAgent)}
                          </span>
                          {isCurrent ? <Badge>当前设备</Badge> : null}
                          <Badge variant="outline">IP {session.ip || '—'}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {session.userAgent || '无 User-Agent'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          创建于 {formatDate(session.createdAt)} · 过期{' '}
                          {formatDate(session.expiresAt)}
                        </p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <Badge
                        variant="outline"
                        className="hidden gap-1.5 text-emerald-700 sm:inline-flex dark:text-emerald-400"
                      >
                        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                        在线
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={revokeOne.isPending}
                        onClick={() => setPendingSession(session)}
                      >
                        强行下线
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingSession)}
        onOpenChange={(open) => {
          if (!open) setPendingSession(null)
        }}
        title="强制下线该会话？"
        desc={
          pendingSession
            ? `将下线「${deviceLabel(pendingSession.userAgent)}」（IP ${pendingSession.ip || '—'}）。`
            : ''
        }
        confirmText="确认下线"
        cancelBtnText="取消"
        destructive
        isLoading={revokeOne.isPending}
        handleConfirm={() => {
          if (!pendingSession) return
          revokeOne.mutate(pendingSession.id, {
            onSuccess: () => setPendingSession(null)
          })
        }}
      />
    </>
  )
}
