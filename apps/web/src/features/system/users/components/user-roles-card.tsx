import { useNavigate } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Label
} from '@zen/ui'
import { AlertTriangle, Shield, ShieldCheck, Trash } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components'
import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { authApi } from '@/features/auth/api'
import { getRoleIconColorClassName } from '@/features/system/roles/data/data'

import { useAssignUserRolesMutation } from '../mutations'

import type { RoleIcon, User } from '@zen/shared'

type UserRolesCardProps = {
  user: User
  onAssign: () => void
}

export function UserRolesCard({ user, onAssign }: UserRolesCardProps) {
  const navigate = useNavigate()
  const { mutate: assignRoles, isPending: isRemoving } = useAssignUserRolesMutation()
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null)
  const [confirmValue, setConfirmValue] = useState('')
  const [password, setPassword] = useState('')

  const removeTarget = user.roles.find((role) => role.id === removeTargetId) ?? null

  const handleOpenRemove = (roleId: string) => {
    setRemoveTargetId(roleId)
    setConfirmValue('')
    setPassword('')
  }

  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    if (confirmValue.trim() !== removeTarget.code) {
      toast.error(`请输入角色编码 ${removeTarget.code} 以确认移除`)
      return
    }

    try {
      const { stepUpToken } = await authApi.stepUp({ password })
      assignRoles(
        {
          id: user.id,
          roleIds: user.roles.filter((role) => role.id !== removeTarget.id).map((role) => role.id),
          stepUpToken
        },
        {
          onSuccess: () => {
            toast.success(`已移除角色「${removeTarget.name}」`)
            setRemoveTargetId(null)
            setConfirmValue('')
            setPassword('')
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : '移除角色失败')
          }
        }
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '二次确认失败')
    }
  }

  return (
    <>
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
            <ItemGroup className="grid gap-3 sm:grid-cols-2">
              {user.roles.map((role) => (
                <Item
                  key={role.id}
                  variant="outline"
                  className="group/item rounded-2xl border px-4 py-4 hover:bg-muted/40"
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate({ to: '/system/roles/$id', params: { id: role.id } })}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    void navigate({ to: '/system/roles/$id', params: { id: role.id } })
                  }}
                >
                  <ItemMedia>
                    <span
                      className={cn(
                        'inline-flex size-10 items-center justify-center rounded-xl',
                        getRoleIconColorClassName(
                          role.iconColor as Parameters<typeof getRoleIconColorClassName>[0]
                        )
                      )}
                    >
                      <DynamicIcon name={(role.icon as RoleIcon | null) ?? 'shield'} />
                    </span>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="min-w-0">
                      <span className="truncate">{role.name}</span>

                      <Badge
                        variant="outline"
                        className="font-mono text-xs bg-green-300/15 text-green-700"
                      >
                        <ShieldCheck /> {role.permissionCount} 项权限
                      </Badge>
                    </ItemTitle>
                    <ItemDescription>{role.description || '该角色暂无描述'}</ItemDescription>
                  </ItemContent>
                  <ItemActions className="opacity-0 transition-opacity group-hover/item:opacity-100">
                    <Can permission={PermissionCode.ROLE_ASSIGN}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="pointer-events-none text-destructive transition-all hover:bg-destructive/20 hover:text-destructive group-hover/item:pointer-events-auto"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleOpenRemove(role.id)
                        }}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </Can>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTargetId(null)
            setConfirmValue('')
            setPassword('')
          }
        }}
        handleConfirm={() => {
          void handleConfirmRemove()
        }}
        disabled={!removeTarget || confirmValue.trim() !== removeTarget.code || !password}
        isLoading={isRemoving}
        title={
          <span className="text-destructive">
            <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} /> 移除角色
          </span>
        }
        desc={
          <div className="flex flex-col gap-4">
            <p>
              确认从用户 <span className="font-semibold">{user.username}</span> 身上移除角色{' '}
              <span className="font-semibold">{removeTarget?.name ?? '-'}</span> 吗？
            </p>
            <Label className="flex flex-col items-start gap-1.5">
              <span>输入角色编码确认</span>
              <Input
                value={confirmValue}
                onChange={(event) => setConfirmValue(event.target.value)}
                placeholder={removeTarget?.code ?? '输入角色编码'}
              />
            </Label>
            <Label className="flex flex-col items-start gap-1.5">
              <span>登录密码（二次确认）</span>
              <PasswordInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="输入当前登录密码"
              />
            </Label>
            <Alert variant="destructive">
              <AlertTitle>敏感操作</AlertTitle>
              <AlertDescription>角色变更后目标用户现有会话将被强制下线。</AlertDescription>
            </Alert>
          </div>
        }
        confirmText="确认移除"
        cancelBtnText="取消"
        destructive
      />
    </>
  )
}
