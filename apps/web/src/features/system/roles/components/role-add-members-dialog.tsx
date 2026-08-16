import { useQuery } from '@tanstack/react-query'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Checkbox,
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
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Label,
  ScrollArea,
  Skeleton
} from '@zen/ui'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAddRoleMembersMutation } from '@/features/system/roles/mutations'
import { userApi } from '@/features/system/users/api'
import { usersQueryKeys } from '@/features/system/users/queries'

import type { User } from '@zen/shared'

type RoleAddMembersDialogProps = {
  roleId: string
  roleName: string
  boundIds: ReadonlySet<string>
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SEARCH_DEBOUNCE_MS = 300
const PICKER_PAGE_SIZE = 50

function displayName(user: { nickname: string | null; realName: string | null; username: string }) {
  return user.realName || user.nickname || user.username
}

function initials(name: string) {
  return name.slice(0, 1).toUpperCase()
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, value])

  return debounced
}

function matchesUser(user: User, keyword: string): boolean {
  const query = keyword.trim().toLowerCase()
  if (!query) return true

  return [user.realName, user.nickname, user.username, user.email, user.phoneNumber]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(query))
}

export function RoleAddMembersDialog({
  roleId,
  roleName,
  boundIds,
  open,
  onOpenChange
}: RoleAddMembersDialogProps) {
  const [keyword, setKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const debouncedKeyword = useDebouncedValue(keyword, SEARCH_DEBOUNCE_MS)
  const { mutate: addMembers, isPending } = useAddRoleMembersMutation()

  const searchKeyword = debouncedKeyword.trim()
  const listParams = useMemo(
    () => ({
      page: 1,
      pageSize: PICKER_PAGE_SIZE,
      status: 'active' as const,
      keyword: searchKeyword || undefined
    }),
    [searchKeyword]
  )

  const {
    data: usersData,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: [...usersQueryKeys.list(listParams), 'role-member-picker'] as const,
    queryFn: () => userApi.getUserList(listParams),
    enabled: open
  })

  const availableUsers = useMemo(() => {
    const list = (usersData?.items ?? []).filter((user) => !boundIds.has(user.id))
    // 输入即时过滤；防抖后的服务端结果到齐后仍再滤一遍，避免 keep-previous 错觉
    return list.filter((user) => matchesUser(user, keyword))
  }, [boundIds, keyword, usersData?.items])

  const availableIdSet = useMemo(
    () => new Set(availableUsers.map((user) => user.id)),
    [availableUsers]
  )

  const selectedCount = selectedIds.length
  const visibleSelectedCount = useMemo(
    () => selectedIds.filter((id) => availableIdSet.has(id)).length,
    [availableIdSet, selectedIds]
  )
  const allVisibleSelected =
    availableUsers.length > 0 && visibleSelectedCount === availableUsers.length

  const resetState = () => {
    setKeyword('')
    setSelectedIds([])
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState()
    onOpenChange(nextOpen)
  }

  const toggleUser = (userId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(userId)) return prev
        return [...prev, userId]
      }
      return prev.filter((id) => id !== userId)
    })
  }

  const handleToggleAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      if (!checked) {
        return prev.filter((id) => !availableIdSet.has(id))
      }
      const next = new Set(prev)
      for (const user of availableUsers) next.add(user.id)
      return [...next]
    })
  }

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      toast.error('请至少选择一名用户')
      return
    }

    addMembers(
      { id: roleId, data: { userIds: selectedIds } },
      {
        onSuccess: () => {
          toast.success(`已成功添加 ${selectedIds.length} 人至该角色`)
          handleOpenChange(false)
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : '添加失败')
      }
    )
  }

  const showInitialLoading = isLoading && !usersData
  const showSearching = isFetching && searchKeyword.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加关联人员</DialogTitle>
          <DialogDescription>勾选一名或多名用户，一次性绑定到「{roleName}」</DialogDescription>
        </DialogHeader>

        <InputGroup>
          <InputGroupInput
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索用户名、昵称或邮箱"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex items-center justify-between gap-2 px-0.5">
          <Label
            htmlFor="role-add-members-select-all"
            className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground"
          >
            <Checkbox
              id="role-add-members-select-all"
              checked={allVisibleSelected}
              disabled={availableUsers.length === 0 || showInitialLoading}
              onCheckedChange={(checked) => handleToggleAllVisible(checked === true)}
            />
            全选当前列表
          </Label>
          <span className="text-xs text-muted-foreground">
            {showSearching ? '搜索中… · ' : null}
            已选 {selectedCount} 人
            {selectedCount > 0 ? (
              <button
                type="button"
                className="ml-2 text-foreground underline-offset-2 hover:underline"
                onClick={() => setSelectedIds([])}
              >
                清空
              </button>
            ) : null}
          </span>
        </div>

        <ScrollArea className="h-72">
          {showInitialLoading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : availableUsers.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {keyword.trim() ? '没有匹配的用户' : '没有可添加的用户'}
            </p>
          ) : (
            <ItemGroup className="gap-2 p-1">
              {availableUsers.map((user) => {
                const name = displayName(user)
                const checked = selectedIds.includes(user.id)
                const checkboxId = `role-add-member-${user.id}`

                return (
                  <Item
                    key={user.id}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => toggleUser(user.id, !checked)}
                  >
                    <ItemMedia>
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        onCheckedChange={(next) => toggleUser(user.id, next === true)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`选择 ${name}`}
                      />
                    </ItemMedia>
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
                  </Item>
                )
              })}
            </ItemGroup>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={isPending || selectedCount === 0} onClick={handleSubmit}>
            {selectedCount > 0 ? `添加 ${selectedCount} 人` : '添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
