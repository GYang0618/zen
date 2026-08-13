import { Badge, Card, CardContent, CardHeader, CardTitle } from '@zen/ui'
import { Clock, Globe, KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react'

import { formatDateTime } from '../utils'

import type { User } from '@zen/shared'
import type { ReactNode } from 'react'

const MFA_TYPE_LABEL: Record<User['mfaType'], string> = {
  totp: 'TOTP',
  sms: '短信',
  email: '邮箱',
  off: '未启用'
}

export function UserSecurityCard({ user }: { user: User }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>安全状态</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <SecurityItem
            icon={<ShieldCheck className="size-4" />}
            label="MFA"
            value={
              <Badge variant={user.mfaEnabled ? 'secondary' : 'outline'}>
                {user.mfaEnabled ? `已启用 · ${MFA_TYPE_LABEL[user.mfaType]}` : '未启用'}
              </Badge>
            }
          />
          <SecurityItem
            icon={<KeyRound className="size-4" />}
            label="强制改密"
            value={user.mustChangePassword ? '下次登录必须修改' : '否'}
          />
          <SecurityItem
            icon={<Clock className="size-4" />}
            label="上次改密"
            value={formatDateTime(user.lastPasswordChange)}
          />
          <SecurityItem
            icon={<ShieldAlert className="size-4" />}
            label="登录失败次数"
            value={`${user.loginAttempts} 次`}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>登录审计</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <SecurityItem
            icon={<Clock className="size-4" />}
            label="最近登录"
            value={formatDateTime(user.lastLoginAt)}
          />
          <SecurityItem
            icon={<Globe className="size-4" />}
            label="登录 IP"
            value={user.lastLoginIp || '—'}
          />
          <SecurityItem
            icon={<Clock className="size-4" />}
            label="最近活跃"
            value={formatDateTime(user.lastActiveAt)}
          />
          <SecurityItem
            icon={<Clock className="size-4" />}
            label="创建时间"
            value={formatDateTime(user.createdAt)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function SecurityItem({
  icon,
  label,
  value
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}
