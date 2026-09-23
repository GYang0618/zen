import { ROLE_ICON_COLOR_VALUES } from '@zen/shared'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  cn,
  Separator
} from '@zen/ui'
import { Briefcase, Mail, ShieldCheck, UserCheck, Users } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import { OrganizationTypeIcon } from '@/features/system/organization/components/organization-icon'
import { organizationTypeLabels } from '@/features/system/organization/data/data'
import { getJobProfileIconColorClassName } from '@/features/system/posts/data'
import { formatJobProfileLevel, jobProfileStatusConfig } from '@/features/system/posts/utils'
import {
  getRoleIconColorClassName,
  roleEffectiveStatusConfig
} from '@/features/system/roles/data/data'
import { statusConfig } from '@/features/system/users/data/data'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { JobProfileIcon, JobProfileIconColor, RoleIcon, RoleIconColor } from '@zen/shared'
import type { IconName } from 'lucide-react/dynamic'

function isRoleIconColor(color: string | null | undefined): color is RoleIconColor {
  return color != null && ROLE_ICON_COLOR_VALUES.some((value) => value === color)
}

// 1. UserCard
export interface A2uiUserCardProps {
  user: {
    id: string
    username: string
    nickname?: string | null
    realName?: string | null
    avatar?: string | null
    email?: string
    phoneNumber?: string | null
    status?: 'active' | 'inactive' | 'suspended'
    roles?: Array<{
      id: string
      code: string
      name: string
      icon?: string | null
      iconColor?: string | null
    }>
    departmentName?: string
    postName?: string
  }
}

export function UserCard({ props }: RendererProps<A2uiUserCardProps>) {
  const { user } = props
  if (!user) return null

  const name = user.nickname || user.realName || user.username
  const status = user.status ? statusConfig[user.status] : undefined
  const roles = user.roles ?? []
  const orgPostLabel = [user.departmentName, user.postName].filter(Boolean).join(' • ')

  return (
    <Card className="min-w-0 w-full rounded-xl border bg-card text-card-foreground shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="size-11">
            {user.avatar ? <AvatarImage src={user.avatar} alt={name} /> : null}
            <AvatarFallback className="font-semibold text-sm">
              {name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-sm text-foreground">{name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              @{user.username}
            </span>
          </div>
        </div>
        {status ? (
          <Badge variant="outline" className={cn('text-[11px]', status.className)}>
            {status.label}
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-2 pt-1 text-xs">
        {orgPostLabel ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="size-3.5 shrink-0" />
            <span className="truncate">{orgPostLabel}</span>
          </div>
        ) : null}

        {user.email ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate font-mono">{user.email}</span>
          </div>
        ) : null}

        {roles.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {roles.map((role) => (
              <Badge key={role.id} variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5">
                <DynamicIcon
                  name={((role.icon as RoleIcon | null) ?? 'shield') as IconName}
                  className="size-3"
                />
                <span>{role.name}</span>
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// 2. RoleCard
export interface A2uiRoleCardProps {
  role: {
    id: string
    code: string
    name: string
    description?: string | null
    icon?: string | null
    iconColor?: string | null
    status?: 'active' | 'disabled'
    effectiveStatus?: 'active' | 'disabled' | 'expired' | 'locked'
    kind?: 'system' | 'custom'
    memberCount?: number
    permissionCount?: number
    isSystem?: boolean
  }
}

export function RoleCard({ props }: RendererProps<A2uiRoleCardProps>) {
  const { role } = props
  if (!role) return null

  const effectiveStatus = role.effectiveStatus
    ? roleEffectiveStatusConfig[role.effectiveStatus]
    : undefined
  const iconColorClass = getRoleIconColorClassName(
    isRoleIconColor(role.iconColor) ? role.iconColor : undefined
  )

  return (
    <Card className="min-w-0 w-full rounded-xl border bg-card text-card-foreground shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              iconColorClass
            )}
          >
            <DynamicIcon
              name={((role.icon as RoleIcon | null) ?? 'shield') as IconName}
              className="size-4.5"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-sm text-foreground">{role.name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">{role.code}</span>
          </div>
        </div>
        {effectiveStatus ? (
          <Badge variant="outline" className={cn('text-[11px]', effectiveStatus.className)}>
            {effectiveStatus.label}
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-2 pt-1 text-xs">
        {role.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{role.description}</p>
        ) : null}

        <Separator />

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5 shrink-0" />
            成员 {role.memberCount ?? 0} 人
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 shrink-0" />
            权限 {role.permissionCount ?? 0} 项
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// 3. PostCard
export interface A2uiPostCardProps {
  item: {
    id: string
    code: string
    name: string
    level?: 'P5' | 'P6' | 'P7' | 'P8'
    status?: 'active' | 'disabled'
    icon?: string | null
    iconColor?: string | null
    activeCount?: number
    frozenCount?: number
    organizationCount?: number
  }
}

export function PostCard({ props }: RendererProps<A2uiPostCardProps>) {
  const { item } = props
  if (!item) return null

  const status = item.status ? jobProfileStatusConfig[item.status] : undefined
  const iconColorClass = getJobProfileIconColorClassName(
    item.iconColor as JobProfileIconColor | null | undefined
  )

  return (
    <Card className="min-w-0 w-full rounded-xl border bg-card text-card-foreground shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              iconColorClass
            )}
          >
            <DynamicIcon
              name={((item.icon as JobProfileIcon | null) ?? 'briefcase-business') as IconName}
              className="size-4.5"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-sm text-foreground">{item.name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">{item.code}</span>
          </div>
        </div>
        {status ? (
          <Badge variant="outline" className={cn('text-[11px]', status.className)}>
            {status.label}
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-2 pt-1 text-xs">
        {item.level ? (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="font-mono text-xs">
              {formatJobProfileLevel(item.level)}
            </Badge>
            <span className="text-muted-foreground text-xs">职级</span>
          </div>
        ) : null}

        <Separator />

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>在编 {item.activeCount ?? 0} 人</span>
          <span>关联 {item.organizationCount ?? 0} 个组织</span>
        </div>
      </CardContent>
    </Card>
  )
}

// 4. OrganizationCard
export interface A2uiOrganizationCardProps {
  organization: {
    id: string
    code: string
    name: string
    type: string
    parentId?: string | null
    leader?: {
      id: string
      name: string
      title?: string | null
      avatar?: string | null
    } | null
    memberCount?: number
    positionCount?: number
    effectiveDate?: string
  }
}

export function OrganizationCard({ props }: RendererProps<A2uiOrganizationCardProps>) {
  const { organization } = props
  if (!organization) return null

  const typeLabel = organizationTypeLabels[organization.type] ?? organization.type
  const leader = organization.leader

  return (
    <Card className="min-w-0 w-full rounded-xl border bg-card text-card-foreground shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
            <OrganizationTypeIcon type={organization.type} className="size-4.5" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-sm text-foreground">
              {organization.name}
            </span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {organization.code}
            </span>
          </div>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {typeLabel}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2 pt-1 text-xs">
        <div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <UserCheck className="size-3.5 shrink-0" />
            负责人
          </span>
          {leader ? (
            <span className="font-medium text-foreground">{leader.name}</span>
          ) : (
            <span className="text-muted-foreground/60">未设置</span>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>成员 {organization.memberCount ?? 0} 人</span>
          <span>编制 {organization.positionCount ?? 0} 个</span>
        </div>
      </CardContent>
    </Card>
  )
}
