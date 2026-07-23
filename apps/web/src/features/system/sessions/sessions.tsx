import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton
} from '@zen/ui'
import { MonitorSmartphone, ShieldOff } from 'lucide-react'
import { useState } from 'react'

import { ConfigDrawer, ConfirmDialog, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Can } from '@/components/auth/can'
import { Header, Main } from '@/components/layouts'
import { EmptyState, SystemPageHeader } from '@/features/system/components'

import { useRevokeAllSessions, useRevokeSession, useSessionsQuery } from './queries'

import type { SessionItem } from './api'

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return '未知设备'
  if (/Mobile|Android|iPhone/i.test(userAgent)) return '移动设备'
  if (/Mac|Windows|Linux/i.test(userAgent)) return '桌面设备'
  return '其他设备'
}

export function Sessions() {
  const { data, isLoading } = useSessionsQuery()
  const revokeOne = useRevokeSession()
  const revokeAll = useRevokeAllSessions()
  const [revokeAllOpen, setRevokeAllOpen] = useState(false)
  const [pendingSession, setPendingSession] = useState<SessionItem | null>(null)

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <SystemPageHeader
          title="登录会话"
          description="查看本账号活跃会话，支持单设备或全部强制下线"
          actions={
            <Can permission={PermissionCode.SESSION_REVOKE}>
              <Button
                variant="outline"
                disabled={revokeAll.isPending || (data?.length ?? 0) === 0}
                onClick={() => setRevokeAllOpen(true)}
              >
                <ShieldOff data-icon="inline-start" />
                全部下线
              </Button>
            </Can>
          }
        />

        <Card size="sm" className="gap-0 py-0">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle>活跃会话</CardTitle>
            <CardDescription>下线后对应设备需重新登录；全部下线也会使当前登录失效</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-5/6" />
              </div>
            ) : (data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={MonitorSmartphone}
                title="暂无活跃会话"
                description="登录后将在此显示设备与 IP 信息"
                compact
              />
            ) : (
              <ul className="divide-y">
                {data?.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <MonitorSmartphone className="size-4" aria-hidden />
                      </div>
                      <div className="min-w-0 flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {deviceLabel(session.userAgent)}
                          </span>
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
                    <Can permission={PermissionCode.SESSION_REVOKE}>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={revokeOne.isPending}
                        onClick={() => setPendingSession(session)}
                      >
                        下线
                      </Button>
                    </Can>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Main>

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        title="强制下线全部会话？"
        desc="当前账号在所有设备上的登录都将失效，需要重新登录。此操作不可撤销。"
        confirmText="全部下线"
        cancelBtnText="取消"
        destructive
        isLoading={revokeAll.isPending}
        handleConfirm={() => {
          revokeAll.mutate(undefined, {
            onSuccess: () => setRevokeAllOpen(false)
          })
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingSession)}
        onOpenChange={(open) => {
          if (!open) setPendingSession(null)
        }}
        title="强制下线该会话？"
        desc={
          pendingSession
            ? `将下线「${deviceLabel(pendingSession.userAgent)}」（IP ${pendingSession.ip || '—'}）。若为当前设备，你也会立即退出。`
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
