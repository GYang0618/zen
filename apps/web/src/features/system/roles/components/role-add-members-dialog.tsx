import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton
} from '@zen/ui'
import { Loader2, Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useUsersQuery } from '@/features/system/users/queries'

import { useAddRoleMembersMutation } from '../mutations'

import type { RoleMember } from '@zen/shared'

type RoleAddMembersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleId: string
  roleName: string
  members: RoleMember[]
}

function displayName(user: { nickname: string | null; realName: string | null; username: string }) {
  return user.realName || user.nickname || user.username
}

export function RoleAddMembersDialog({
  open,
  onOpenChange,
  roleId,
  roleName,
  members
}: RoleAddMembersDialogProps) {
  const [keyword, setKeyword] = useState('')
  const { data, isLoading } = useUsersQuery({
    page: 1,
    pageSize: 50,
    keyword: keyword.trim() || undefined
  })
  const { mutate: addMembers, isPending, variables } = useAddRoleMembersMutation()

  const assignedIds = useMemo(() => new Set(members.map((member) => member.id)), [members])
  const users = data?.items ?? []

  const handleAdd = (userId: string) => {
    addMembers(
      { id: roleId, data: { userIds: [userId] } },
      {
        onSuccess: () => {
          toast.success('已成功添加所选人员至该角色')
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : '添加失败')
        }
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setKeyword('')
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" aria-hidden />
            添加关联人员
          </DialogTitle>
          <DialogDescription>
            将人员绑定至「{roleName}」，可连续添加，关闭右上角即可
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索用户名 / 邮箱 / 昵称"
            className="h-8 ps-8 text-xs"
            aria-label="搜索可绑定用户"
          />
        </div>

        <div className="max-h-60 space-y-2 overflow-y-auto pe-1">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">未找到可添加的用户</p>
          ) : (
            users.map((user) => {
              const name = displayName(user)
              const assigned = assignedIds.has(user.id)
              const adding = isPending && variables?.data.userIds.includes(user.id)

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background p-2.5 hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="size-8 border">
                      <AvatarImage src={user.avatar ?? undefined} alt={name} />
                      <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">
                        {name}
                        {user.deptName ? (
                          <span className="text-muted-foreground"> ({user.deptName})</span>
                        ) : null}
                      </div>
                      <div className="truncate font-mono text-[10px] text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {assigned ? (
                    <span className="rounded bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                      已绑定
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleAdd(user.id)}
                    >
                      {adding ? <Loader2 className="animate-spin" /> : '添加'}
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
