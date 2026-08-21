import { Link } from '@tanstack/react-router'
import { formatFromNow, ROLE_MEMBER_PREVIEW_LIMIT } from '@zen/shared'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  cn
} from '@zen/ui'
import { ShieldCheck } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import { getRoleIconColorClassName, roleEffectiveStatusConfig } from '../data/data'
import { RolesRowActions } from './roles-row-actions'

import type { Role, RoleIcon } from '@zen/shared'

type RolesCardProps = {
  role: Role
}

export function RolesCard({ role }: RolesCardProps) {
  const previewMembers = role.memberPreview.slice(0, ROLE_MEMBER_PREVIEW_LIMIT)
  const overflowCount = role.memberCount - previewMembers.length

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex gap-3">
          <Link to="/system/roles/$id" params={{ id: role.id }} className="flex flex-1 gap-3">
            <div
              className={cn(
                'flex size-12 items-center justify-center rounded-full',
                getRoleIconColorClassName(role.iconColor)
              )}
            >
              <DynamicIcon name={(role.icon as RoleIcon | null) ?? 'shield'} />
            </div>
            <div className="flex-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {role.name}
                <Badge
                  className={cn(
                    'border',
                    roleEffectiveStatusConfig[role.effectiveStatus].className
                  )}
                >
                  {roleEffectiveStatusConfig[role.effectiveStatus].label}
                </Badge>
              </h2>
              <div className="mt-1 text-xs text-muted-foreground">{role.code}</div>
              <div className="mt-1">
                <Badge variant="secondary">
                  {role.expiresAt ? `过期时间：${formatFromNow(role.expiresAt)}` : '长期有效'}
                </Badge>
              </div>
            </div>
          </Link>

          <RolesRowActions role={role} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="min-h-10 line-clamp-2 text-sm leading-5 text-muted-foreground">
          {role.description || '该角色没有任何描述'}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
            <ShieldCheck className="size-3.5" />
            <span>{role.permissionCount} 项权限</span>
          </div>
          <AvatarGroup>
            {previewMembers.map((member) => (
              <Avatar key={member.id} size="sm">
                {member.avatar ? <AvatarImage src={member.avatar} alt="" /> : null}
                <AvatarFallback>{(member.nickname ?? '?').slice(0, 1)}</AvatarFallback>
              </Avatar>
            ))}
            {overflowCount > 0 ? <AvatarGroupCount>+{overflowCount}</AvatarGroupCount> : null}
          </AvatarGroup>
        </div>
      </CardContent>
    </Card>
  )
}
