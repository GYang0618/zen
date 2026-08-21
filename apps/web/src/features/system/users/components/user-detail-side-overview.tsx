import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  cn
} from '@zen/ui'
import {
  Activity,
  Building2,
  CalendarDays,
  Clock3,
  Globe,
  KeyRound,
  Mail,
  Mars,
  Pencil,
  Phone,
  Users,
  Venus
} from 'lucide-react'

import { statusConfig } from '../data/data'
import {
  formatFromNow,
  getOrganizationLabel,
  getPrimaryMembership,
  getUserDisplayName,
  getUserInitials
} from '../utils'

import type { User } from '@zen/shared'
import type { LucideIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'

export function UserDetailSideOverview({ user, onEdit }: { user: User; onEdit: () => void }) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed bg-muted/35 p-3 @5xl/content:w-90 @5xl/content:self-start">
      <BaseInfoCard user={user} onEdit={onEdit} />
      <SecurityStatusCard user={user} />
      <LoginAuditCard user={user} />
    </aside>
  )
}

function BaseInfoCard({ user, onEdit }: { user: User; onEdit: () => void }) {
  const displayName = getUserDisplayName(user)
  const primary = getPrimaryMembership(user)
  const status = statusConfig[user.status]
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
        <CardAction>
          <Button variant="ghost" onClick={onEdit} aria-label="编辑用户信息">
            <Pencil className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            <AvatarImage src={user.avatar ?? undefined} alt={displayName} />
            <AvatarFallback className="text-2xl">{getUserInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-medium leading-6 flex items-center gap-2">
              {displayName}
              <span>
                {user.gender === 'unknown' ? null : user.gender === 'male' ? (
                  <Mars className="size-4 text-blue-500" />
                ) : (
                  <Venus className="size-4 text-pink-500" />
                )}
              </span>
            </p>
            <p className="font-mono text-sm text-muted-foreground">@{user.username} </p>
          </div>

          <Badge variant="outline" className={cn(status.className, 'ml-auto')}>
            {status.label}
          </Badge>
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" /> <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />{' '}
            <span>{user.phoneNumber ?? '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />{' '}
            <span>{getOrganizationLabel(primary)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SecurityStatusCard({ user }: { user: User }) {
  const MFA_TYPE_LABEL: Record<User['mfaType'], string> = {
    totp: 'TOTP',
    sms: '短信',
    email: '邮箱',
    off: '未启用'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>安全状态</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <OverviewCol
            label="MFA"
            value={user.mfaEnabled ? `已启用 · ${MFA_TYPE_LABEL[user.mfaType]}` : '未启用'}
          />
          <OverviewCol
            label="认证方式"
            value={
              <Badge variant="secondary" className="h-6 px-2.5">
                <KeyRound /> 账号密码
              </Badge>
            }
          />
          <OverviewCol label="上次改密" value={formatFromNow(user.lastPasswordChange)} />
          <OverviewCol label="登录失败次数" value={`${user.loginAttempts} 次`} />
          <OverviewCol
            label="认证过期时间"
            value={formatFromNow(user.accessTokenExpiresAt)}
            className="col-span-2"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function LoginAuditCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>登录审计</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <OverviewRow icon={Clock3} label="最近登录" value={formatFromNow(user.lastLoginAt)} />
          <OverviewRow
            icon={Activity}
            label="最后活跃时间"
            value={formatFromNow(user.lastActiveAt)}
          />
          <OverviewRow icon={Globe} label="最近登录IP" value={user.lastLoginIp ?? '-'} />
          <OverviewRow
            icon={Users}
            label="当前在线会话数"
            value={<Badge variant="secondary">{user.activeSessionCount}</Badge>}
          />
          <OverviewRow icon={CalendarDays} label="创建时间" value={formatFromNow(user.createdAt)} />
        </div>
      </CardContent>
    </Card>
  )
}

function OverviewCol({
  label,
  icon: Icon,
  value,
  className
}: {
  label: string
  icon?: LucideIcon
  value: ReactNode
  className?: HTMLAttributes<HTMLDivElement>['className']
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-muted-foreground text-xs font-semibold flex items-center gap-1">
        {label}
        {Icon ? <Icon className="size-4" /> : null}
      </span>
      <span className="font-medium ">{value}</span>
    </div>
  )
}

function OverviewRow({
  icon: Icon,
  label,
  value
}: {
  icon?: LucideIcon
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {Icon ? <Icon className="size-4" /> : null}
        {label}
      </span>
      <span className="max-w-48 text-end font-medium break-all">{value}</span>
    </div>
  )
}
