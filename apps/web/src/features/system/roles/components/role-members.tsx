import { formatFromNow, PermissionCode } from '@zen/shared'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
  ItemTitle,
  Skeleton
} from '@zen/ui'
import { UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { useRemoveRoleMemberMutation } from '@/features/system/roles/mutations'
import { useRoleMembersQuery } from '@/features/system/roles/queries'
import { isCurrentUserId, useAccessChangeFeedback } from '@/lib/auth/access-change'

import { RoleAddMembersDialog } from './role-add-members-dialog'

import type { RoleMember } from '@zen/shared'

type RoleMembersProps = {
  roleId: string
  roleName: string
  memberCount: number
}

function displayName(user: { nickname: string | null; realName: string | null; username: string }) {
  return user.realName || user.nickname || user.username
}

function initials(name: string) {
  return name.slice(0, 1).toUpperCase()
}

export function RoleMembers({ roleId, roleName, memberCount }: RoleMembersProps) {
  const { data, isLoading } = useRoleMembersQuery(roleId)
  const { mutate: removeMember, isPending: isRemoving } = useRemoveRoleMemberMutation()
  const notifyAccessChange = useAccessChangeFeedback()

  const members = data?.items ?? []
  const [addOpen, setAddOpen] = useState(false)
  const [unbindOpen, setUnbindOpen] = useState(false)
  const [targetUnbindId, setTargetUnbindId] = useState<string | null>(null)

  const boundIdSet = useMemo(() => new Set(members.map((member) => member.id)), [members])
  const removeTarget = members.find((member) => member.id === targetUnbindId)

  const handleConfirmRemove = () => {
    if (!targetUnbindId) return
    removeMember(
      { id: roleId, userId: targetUnbindId },
      {
        onSuccess: () => {
          notifyAccessChange(targetUnbindId, '已将人员从当前角色解绑')
          setUnbindOpen(false)
          setTargetUnbindId(null)
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : '解绑失败')
        }
      }
    )
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>关联用户</CardTitle>
        <CardDescription>
          关联用户将实时继承「{roleName}」的功能权限与数据边界
          {memberCount > 0 ? `（当前 ${memberCount} 人）` : null}
        </CardDescription>
        <CardAction>
          <Can permission={PermissionCode.ROLE_ASSIGN}>
            <Button size="sm" className="rounded-full" onClick={() => setAddOpen(true)}>
              <UserPlus />
              添加关联人员
            </Button>
          </Can>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="当前角色暂未绑定任何员工"
            description="点击右上角添加关联人员"
            compact
          />
        ) : (
          <ItemGroup className="gap-2">
            {members.map((user) => {
              const name = displayName(user)
              return (
                <Item key={user.id} variant="outline" className="rounded-2xl">
                  <ItemMedia>
                    <Avatar>
                      <AvatarImage src={user.avatar ?? undefined} alt={name} />
                      <AvatarFallback>{initials(name)}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      {name}
                      {user.deptName ? (
                        <span className="text-xs font-normal text-muted-foreground">
                          （{user.deptName}）
                        </span>
                      ) : null}
                    </ItemTitle>
                    <ItemDescription>
                      {user.email} · 绑定于 {formatFromNow(user.boundAt)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Can permission={PermissionCode.ROLE_ASSIGN}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          setTargetUnbindId(user.id)
                          setUnbindOpen(true)
                        }}
                      >
                        解绑
                      </Button>
                    </Can>
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        )}
      </CardContent>

      <RoleAddMembersDialog
        roleId={roleId}
        roleName={roleName}
        boundIds={boundIdSet}
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <ConfirmDialog
        open={unbindOpen}
        onOpenChange={(open) => {
          if (!open) {
            setUnbindOpen(false)
            setTargetUnbindId(null)
          }
        }}
        title="解绑关联用户？"
        desc={
          removeTarget
            ? isCurrentUserId(removeTarget.id)
              ? `确认将自己从角色「${roleName}」解绑？保存后请重新登录。`
              : `确认将「${displayName(removeTarget)}」从角色「${roleName}」解绑？`
            : '确认解绑该用户？'
        }
        cancelBtnText="取消"
        confirmText="确认解绑"
        destructive
        isLoading={isRemoving}
        handleConfirm={handleConfirmRemove}
      />
    </Card>
  )
}

export type { RoleMember }
