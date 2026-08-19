import { Link } from '@tanstack/react-router'
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@zen/ui'
import { ChevronRight, Shield, ShieldCheck } from 'lucide-react'

import { Can } from '@/components/auth/can'
import { EmptyState } from '@/components/empty-state'

import { UserRoleIcon } from './user-role-icon'

import type { User } from '@zen/shared'

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
              管理角色
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
                  管理角色
                </Button>
              </Can>
            }
          />
        ) : (
          <ItemGroup className="grid gap-3 sm:grid-cols-2">
            {user.roles.map((role) => (
              <Item
                key={role.id}
                variant="outline"
                className="rounded-2xl border px-4 py-4"
                asChild
              >
                <Link to="/system/roles/$id" params={{ id: role.id }}>
                  <ItemMedia>
                    <UserRoleIcon icon={role.icon} iconColor={role.iconColor} />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="min-w-0">
                      <span className="truncate">{role.name}</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        <ShieldCheck /> {role.permissionCount} 项权限
                      </Badge>
                    </ItemTitle>
                    <ItemDescription>{role.description || '该角色暂无描述'}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRight className="text-muted-foreground" aria-hidden="true" />
                  </ItemActions>
                </Link>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  )
}
