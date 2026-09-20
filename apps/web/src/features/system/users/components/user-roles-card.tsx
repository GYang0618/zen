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
  cn,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@zen/ui'
import { ChevronRight, Shield, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { isCurrentUserId, useAccessChangeFeedback } from '@/lib/auth/access-change'

import { useSetPrimaryUserRoleMutation } from '../mutations'
import { UserRoleIcon } from './user-role-icon'

import type { User, UserRolePreview } from '@zen/shared'

type UserRolesCardProps = {
  user: User
  onAssign: () => void
}

export function UserRolesCard({ user, onAssign }: UserRolesCardProps) {
  const roles = [...user.roles].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary))
  const [pendingPrimary, setPendingPrimary] = useState<UserRolePreview>()
  const { mutate: setPrimaryRole, isPending } = useSetPrimaryUserRoleMutation()
  const notifyAccessChange = useAccessChangeFeedback()
  const canSwitchPrimary = roles.length > 1

  const handleConfirmPrimary = () => {
    if (!pendingPrimary) return
    setPrimaryRole(
      {
        id: user.id,
        primaryRoleId: pendingPrimary.id
      },
      {
        onSuccess: () => {
          notifyAccessChange(user.id, '主角色已更新')
          setPendingPrimary(undefined)
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : '更新主角色失败')
      }
    )
  }

  return (
    <>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>关联角色</CardTitle>
          <CardDescription>用户通过角色继承功能权限与数据边界；可指定一个主角色</CardDescription>
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
          {roles.length === 0 ? (
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
              {roles.map((role) => (
                <Item
                  key={role.id}
                  variant="outline"
                  className="rounded-2xl border px-4 py-4"
                >
                  <Link
                    to="/system/roles/$id"
                    params={{ id: role.id }}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
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
                    <ChevronRight className="text-muted-foreground" aria-hidden="true" />
                  </Link>
                  <ItemActions>
                    {role.isPrimary ? (
                      <Badge>主角色</Badge>
                    ) : (
                      <Can
                        permission={PermissionCode.ROLE_ASSIGN}
                        fallback={<Badge variant="secondary">附属</Badge>}
                      >
                        {canSwitchPrimary ? (
                          <div className="group/primary relative inline-flex items-center justify-end">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'transition-opacity duration-200',
                                'group-hover/primary:opacity-0 group-focus-within/primary:opacity-0',
                                '[@media(hover:none)]:opacity-0'
                              )}
                            >
                              附属
                            </Badge>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              aria-label={`将${role.name}设为主角色`}
                              className={cn(
                                'absolute right-0',
                                'pointer-events-none opacity-0 transition-opacity duration-200',
                                'group-hover/primary:pointer-events-auto group-hover/primary:opacity-100',
                                'group-focus-within/primary:pointer-events-auto group-focus-within/primary:opacity-100',
                                'focus-visible:opacity-100',
                                '[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100'
                              )}
                              onClick={() => setPendingPrimary(role)}
                            >
                              设为主角色
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="secondary">附属</Badge>
                        )}
                      </Can>
                    )}
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingPrimary)}
        onOpenChange={(open) => {
          if (!open) setPendingPrimary(undefined)
        }}
        title="确认切换主角色"
        desc={
          pendingPrimary
            ? `将「${pendingPrimary.name}」设为 ${user.username} 的主角色？${
                isCurrentUserId(user.id) ? '变更后当前会话可能被强制下线。' : ''
              }`
            : ''
        }
        confirmText="确认切换"
        isLoading={isPending}
        handleConfirm={handleConfirmPrimary}
      />
    </>
  )
}
