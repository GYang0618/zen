import { PermissionCode } from '@zen/shared'
import { Avatar, AvatarFallback, AvatarImage, Button, Skeleton } from '@zen/ui'
import { UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components'
import { Can } from '@/components/auth/can'
import { EmptyState } from '@/features/system/components'

import { useRemoveRoleMemberMutation } from '../mutations'
import { useRoleMembersQuery } from '../queries'
import { RoleAddMembersDialog } from './role-add-members-dialog'

type RoleMembersTabProps = {
  roleId: string
  roleName: string
  memberCount: number
}

function displayName(user: { nickname: string | null; realName: string | null; username: string }) {
  return user.realName || user.nickname || user.username
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function RoleMembersTab({ roleId, roleName, memberCount }: RoleMembersTabProps) {
  const { data, isLoading } = useRoleMembersQuery(roleId)
  const { mutate: removeMember, isPending } = useRemoveRoleMemberMutation()
  const [addOpen, setAddOpen] = useState(false)
  const [removeUserId, setRemoveUserId] = useState<string | null>(null)

  const members = data?.items ?? []
  const removeTarget = members.find((member) => member.id === removeUserId)

  const handleConfirmRemove = () => {
    if (!removeUserId) return
    removeMember(
      { id: roleId, userId: removeUserId },
      {
        onSuccess: () => {
          toast.success('已将人员从当前角色解绑')
          setRemoveUserId(null)
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : '解绑失败')
        }
      }
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">与此角色绑定的用户列表</h3>
          <p className="text-xs text-muted-foreground">
            关联用户将实时继承「{roleName}」的功能权限与数据边界
            {memberCount > 0 ? `（当前 ${memberCount} 人）` : null}
          </p>
        </div>
        <Can permission={PermissionCode.ROLE_ASSIGN}>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus data-icon="inline-start" />
            添加关联人员
          </Button>
        </Can>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {isLoading ? (
          <div className="space-y-0 divide-y">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-4">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="当前角色暂未绑定任何员工"
              description="点击右上角添加关联人员"
              compact
            />
          </div>
        ) : (
          <ul className="divide-y">
            {members.map((user) => {
              const name = displayName(user)
              return (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9 border">
                      <AvatarImage src={user.avatar ?? undefined} alt={name} />
                      <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span className="truncate">{name}</span>
                        {user.deptName ? (
                          <span className="text-xs font-normal text-muted-foreground">
                            ({user.deptName})
                          </span>
                        ) : null}
                      </div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">绑定时间: {formatDate(user.boundAt)}</span>
                    <Can permission={PermissionCode.ROLE_ASSIGN}>
                      <button
                        type="button"
                        className="text-xs text-rose-500 transition-colors hover:text-rose-600"
                        onClick={() => setRemoveUserId(user.id)}
                      >
                        解绑
                      </button>
                    </Can>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <RoleAddMembersDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        roleId={roleId}
        roleName={roleName}
        members={members}
      />

      <ConfirmDialog
        open={removeUserId !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveUserId(null)
        }}
        title="解绑关联用户？"
        desc={
          removeTarget
            ? `确认将「${displayName(removeTarget)}」从角色「${roleName}」解绑？目标用户需重新登录后权限生效。`
            : '确认解绑该用户？'
        }
        confirmText="确认解绑"
        destructive
        isLoading={isPending}
        handleConfirm={handleConfirmRemove}
      />
    </div>
  )
}
