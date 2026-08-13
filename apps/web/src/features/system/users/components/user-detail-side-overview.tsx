import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator
} from '@zen/ui'
import { Fingerprint, Mail, Phone, ShieldCheck } from 'lucide-react'

import { genderLabels, organizationTypeLabels, statusConfig } from '../data/data'
import {
  formatDateTime,
  getOrganizationLabel,
  getPrimaryMembership,
  getUserDisplayName,
  getUserInitials
} from '../utils'

import type { User } from '@zen/shared'
import type { ReactNode } from 'react'

export function UserDetailSideOverview({ user }: { user: User }) {
  const primary = getPrimaryMembership(user)
  const displayName = getUserDisplayName(user)
  const status = statusConfig[user.status]

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed bg-muted/35 p-3 @5xl/content:w-90 @5xl/content:self-start">
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-14">
              <AvatarImage src={user.avatar ?? undefined} alt={displayName} />
              <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-medium leading-6">{displayName}</p>
              <p className="font-mono text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            {user.isLocked ? <Badge variant="destructive">已锁定</Badge> : null}
            {user.mfaEnabled ? (
              <Badge variant="secondary">
                <ShieldCheck />
                MFA
              </Badge>
            ) : null}
          </div>

          <Separator />

          <OverviewRow
            icon={<Fingerprint className="size-4" />}
            label="真实姓名"
            value={user.realName || '—'}
          />
          <OverviewRow icon={<Mail className="size-4" />} label="邮箱" value={user.email} />
          <OverviewRow
            icon={<Phone className="size-4" />}
            label="手机"
            value={user.phoneNumber || '—'}
          />
          <OverviewRow label="性别" value={genderLabels[user.gender]} />
          <OverviewRow
            label="主职"
            value={
              primary
                ? `${getOrganizationLabel(primary)}${
                    primary.organizationType
                      ? ` · ${organizationTypeLabels[primary.organizationType] ?? primary.organizationType}`
                      : ''
                  }`
                : '未分配'
            }
          />
          <OverviewRow label="最近登录" value={formatDateTime(user.lastLoginAt)} />
        </CardContent>
      </Card>
    </aside>
  )
}

function OverviewRow({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="max-w-48 text-end font-medium break-all">{value}</span>
    </div>
  )
}
