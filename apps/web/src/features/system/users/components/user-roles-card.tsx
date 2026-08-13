import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn
} from '@zen/ui'
import { Shield } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import { Can } from '@/components/auth/can'
import { EmptyState } from '@/components/empty-state'
import { getRoleIconColorClassName } from '@/features/system/roles-v2/data/data'

import type { RoleIcon, User } from '@zen/shared'

type UserRolesCardProps = {
  user: User
  onAssign: () => void
}

export function UserRolesCard({ user, onAssign }: UserRolesCardProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>关联角色</CardTitle>
        <CardDescription>用户通过角色继承功能权限与数据边界</CardDescription>
        <CardAction>
          <Can permission={PermissionCode.ROLE_ASSIGN}>
            <Button size="sm" className="rounded-full" onClick={onAssign}>
              <Shield />
              分配角色
            </Button>
          </Can>
        </CardAction>
      </CardHeader>
      <CardContent>
        {user.roles.length === 0 ? (
          <EmptyState
            title="暂无角色"
            description="该用户尚未绑定任何角色"
            action={
              <Can permission={PermissionCode.ROLE_ASSIGN}>
                <Button size="sm" variant="outline" onClick={onAssign}>
                  分配角色
                </Button>
              </Can>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {user.roles.map((role) => (
              <div key={role.id} className="flex items-start gap-3 rounded-xl border p-4">
                <span
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-lg',
                    getRoleIconColorClassName(
                      role.iconColor as Parameters<typeof getRoleIconColorClassName>[0]
                    )
                  )}
                >
                  <DynamicIcon name={(role.icon as RoleIcon | null) ?? 'shield'} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{role.name}</p>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {role.code}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {role.kind === 'system' ? '系统角色' : '自定义角色'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
