import { Link } from '@tanstack/react-router'
import { Badge, Button, Card, CardAction, CardContent, CardHeader, cn } from '@zen/ui'
import { CopyIcon } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { toast } from 'sonner'

import { getRoleIconColorClassName } from '@/features/system/roles/data/data'

import { statusConfig } from '../data/data'
import {
  formatFromNow,
  formatPhoneNumber,
  getPrimaryMembership,
  getUserDisplayName
} from '../utils'
import { UserAvatar } from './user-avatar'
import { UsersCardActions } from './users-card-actions'

import type { RoleIcon, User } from '@zen/shared'

type UsersCardProps = {
  user: User
}

async function copyText(value: string, successLabel: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`已复制${successLabel}`)
  } catch {
    toast.error('复制失败，请手动选择')
  }
}

export function UsersCard({ user }: UsersCardProps) {
  const name = getUserDisplayName(user)
  const status = statusConfig[user.status]
  const primary = getPrimaryMembership(user)
  const roles = user.roles ?? []
  const jobLabel = [primary?.postName, primary?.postLevel].filter(Boolean).join(' • ')

  return (
    <Card className="min-w-0 gap-0">
      <CardHeader>
        <Link
          to="/system/users/$userId"
          params={{ userId: user.id }}
          className="w-fit rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar user={user} className="size-14" fallbackClassName="text-2xl" />
        </Link>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            {user.isLocked ? (
              <Badge variant="destructive" className="font-normal">
                已锁定
              </Badge>
            ) : null}
            <UsersCardActions user={user} />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mt-4 min-w-0">
          <h2 className="truncate text-lg font-semibold">
            <Link to="/system/users/$userId" params={{ userId: user.id }}>
              {name}
              <span className="ml-1 font-mono text-sm font-normal text-muted-foreground">
                @{user.username}
              </span>
            </Link>
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {roles.length === 0 ? (
              <span className="text-sm text-muted-foreground">未分配角色</span>
            ) : (
              <>
                {roles.slice(0, 2).map((role) => (
                  <Badge key={role.id} variant="secondary" className="gap-1 font-normal">
                    <span
                      className={cn(
                        'inline-flex size-4 items-center justify-center rounded-sm',
                        getRoleIconColorClassName(
                          role.iconColor as Parameters<typeof getRoleIconColorClassName>[0]
                        )
                      )}
                    >
                      <DynamicIcon
                        name={(role.icon as RoleIcon | null) ?? 'shield'}
                        className="size-3"
                      />
                    </span>
                    {role.name}
                  </Badge>
                ))}
                {roles.length > 2 ? <Badge variant="secondary">+{roles.length - 2}</Badge> : null}
              </>
            )}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground">组织/部门</span>
            <p className="mt-1 truncate text-sm font-medium text-secondary-foreground">
              {primary?.organizationName ?? '未分配组织'}
            </p>
          </div>
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground">最后活跃时间</span>
            <p className="mt-1 truncate text-sm font-medium text-secondary-foreground">
              {formatFromNow(user.lastActiveAt)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex min-w-0 flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate">{user.email}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`复制${name}的邮箱`}
              onClick={() => void copyText(user.email, '邮箱')}
            >
              <CopyIcon />
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">{formatPhoneNumber(user.phoneNumber)}</span>
            <span className="min-w-0 truncate text-end">{jobLabel || '未分配岗位'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
