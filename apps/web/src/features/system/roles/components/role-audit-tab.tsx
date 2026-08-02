import { Skeleton } from '@zen/ui'
import { History } from 'lucide-react'

import { useAuditList } from '@/features/system/audit/queries'
import { EmptyState } from '@/features/system/config/components'

type RoleAuditTabProps = {
  roleId: string
  roleName: string
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function summarizeDiff(diff: unknown): string {
  if (diff == null) return '无详细变更内容'
  if (typeof diff === 'string') return diff
  try {
    return JSON.stringify(diff, null, 0).slice(0, 280)
  } catch {
    return '无法解析变更详情'
  }
}

export function RoleAuditTab({ roleId, roleName }: RoleAuditTabProps) {
  const { data, isLoading, isError } = useAuditList({
    keyword: roleId,
    page: 1,
    pageSize: 20
  })

  const logs = data?.items ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">角色变更审计轨迹</h3>
        <p className="text-xs text-muted-foreground">
          展示与「{roleName}」相关的权限分配与配置变更记录
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={History}
          title="无法加载审计日志"
          description="请确认当前账号具备审计查看权限"
          compact
        />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="暂无相关审计记录"
          description="保存权限或基础信息变更后，轨迹会出现在这里"
          compact
        />
      ) : (
        <div className="relative ml-3 space-y-6 border-s border-border pt-2">
          {logs.map((log) => (
            <div key={log.id} className="relative ps-6">
              <div className="absolute -start-1.5 top-1 size-3 rounded-full border-2 border-background bg-primary" />
              <div className="space-y-1 rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-foreground">
                    {log.actorId ? `操作者 ${log.actorId.slice(0, 8)}…` : '系统'}
                  </span>
                  <span className="shrink-0 font-mono text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
                <div className="text-xs font-medium text-foreground">
                  {log.action}
                  {log.resource ? (
                    <span className="text-muted-foreground"> · {log.resource}</span>
                  ) : null}
                </div>
                <p className="mt-2 rounded border border-border/40 bg-muted/40 p-2 font-mono text-xs text-muted-foreground">
                  {summarizeDiff(log.diff)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
