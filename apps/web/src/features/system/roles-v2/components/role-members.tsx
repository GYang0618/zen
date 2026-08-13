import { PermissionCode } from '@zen/shared'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ScrollArea,
  Skeleton
} from '@zen/ui'
import { Search, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import {
  useAddRoleMembersMutation,
  useRemoveRoleMemberMutation
} from '@/features/system/roles-v2/mutations'
import { useRoleMembersQuery } from '@/features/system/roles-v2/queries'
import { useUsersQuery } from '@/features/system/users/queries'

import type { RoleMember } from '@zen/shared'

type RoleMembersProps = {
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

function initials(name: string) {
  return name.slice(0, 1).toUpperCase()
}

export function RoleMembers({ roleId, roleName, memberCount }: RoleMembersProps) {
  const { data, isLoading } = useRoleMembersQuery(roleId)
  const { mutate: removeMember, isPending: isRemoving } = useRemoveRoleMemberMutation()
  const { mutate: addMembers, isPending: isAdding } = useAddRoleMembersMutation()

  const members = data?.items ?? []
  const [addOpen, setAddOpen] = useState(false)
  const [addKeyword, setAddKeyword] = useState('')
  const [unbindOpen, setUnbindOpen] = useState(false)
  const [targetUnbindId, setTargetUnbindId] = useState<string | null>(null)

  const boundIdSet = useMemo(() => new Set(members.map((member) => member.id)), [members])
  const removeTarget = members.find((member) => member.id === targetUnbindId)

  const { data: usersData, isLoading: usersLoading } = useUsersQuery({
    page: 1,
    pageSize: 50,
    keyword: addKeyword.trim() || undefined
  })

  const availableUsers = (usersData?.items ?? []).filter((user) => !boundIdSet.has(user.id))

  const handleConfirmRemove = () => {
    if (!targetUnbindId) return
    removeMember(
      { id: roleId, userId: targetUnbindId },
      {
        onSuccess: () => {
          toast.success('已将人员从当前角色解绑')
          setUnbindOpen(false)
          setTargetUnbindId(null)
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : '解绑失败')
        }
      }
    )
  }

  const handleAdd = (userId: string) => {
    addMembers(
      { id: roleId, data: { userIds: [userId] } },
      {
        onSuccess: () => toast.success('已成功添加所选人员至该角色'),
        onError: (error) => toast.error(error instanceof Error ? error.message : '添加失败')
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
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                setAddKeyword('')
                setAddOpen(true)
              }}
            >
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
                      {user.email} · 绑定于 {formatDate(user.boundAt)}
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

      <Dialog
        open={addOpen}
        onOpenChange={(next) => {
          if (!next) setAddKeyword('')
          setAddOpen(next)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加关联人员</DialogTitle>
            <DialogDescription>搜索并选择要绑定到「{roleName}」的用户</DialogDescription>
          </DialogHeader>
          <InputGroup>
            <InputGroupInput
              value={addKeyword}
              onChange={(event) => setAddKeyword(event.target.value)}
              placeholder="搜索用户名、昵称或邮箱"
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <ScrollArea className="h-72">
            {usersLoading ? (
              <div className="space-y-2 p-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : availableUsers.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">没有可添加的用户</p>
            ) : (
              <ItemGroup className="gap-2 p-1">
                {availableUsers.map((user) => {
                  const name = displayName(user)
                  return (
                    <Item key={user.id} variant="outline">
                      <ItemMedia>
                        <Avatar size="sm">
                          <AvatarImage src={user.avatar ?? undefined} alt={name} />
                          <AvatarFallback>{initials(name)}</AvatarFallback>
                        </Avatar>
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{name}</ItemTitle>
                        <ItemDescription>{user.email}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button size="sm" disabled={isAdding} onClick={() => handleAdd(user.id)}>
                          添加
                        </Button>
                      </ItemActions>
                    </Item>
                  )
                })}
              </ItemGroup>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            ? `确认将「${displayName(removeTarget)}」从角色「${roleName}」解绑？目标用户需重新登录后权限生效。`
            : '确认解绑该用户？'
        }
        confirmText="确认解绑"
        destructive
        isLoading={isRemoving}
        handleConfirm={handleConfirmRemove}
      />
    </Card>
  )
}

export type { RoleMember }
