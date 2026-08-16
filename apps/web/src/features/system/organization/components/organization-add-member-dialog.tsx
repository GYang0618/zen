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
  ScrollArea
} from '@zen/ui'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAddOrganizationMember, useOrganizationUserOptions } from '../queries'

import type { OrganizationUserOption } from '../type'

type OrganizationAddMemberDialogProps = {
  organizationId: string
  memberIds: ReadonlySet<string>
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SEARCH_DEBOUNCE_MS = 300

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, value])

  return debounced
}

function matchesUser(user: OrganizationUserOption, keyword: string): boolean {
  const query = keyword.trim().toLowerCase()
  if (!query) return true
  return [user.name, user.email, user.title, user.phone]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query))
}

export function OrganizationAddMemberDialog({
  organizationId,
  memberIds,
  open,
  onOpenChange
}: OrganizationAddMemberDialogProps) {
  const [keyword, setKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const debouncedKeyword = useDebouncedValue(keyword, SEARCH_DEBOUNCE_MS)
  const addMembers = useAddOrganizationMember(organizationId)
  const { data, isFetching } = useOrganizationUserOptions(debouncedKeyword, open)

  const availableUsers = useMemo(() => {
    const list = (data ?? []).filter((user) => !memberIds.has(user.id))
    return list.filter((user) => matchesUser(user, keyword))
  }, [data, keyword, memberIds])

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
      if (!checked) return prev.filter((id) => !availableIdSet.has(id))
      const next = new Set(prev)
      for (const user of availableUsers) next.add(user.id)
      return [...next]
    })
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error('请至少选择一名用户')
      return
    }

    try {
      await addMembers.mutateAsync({ userIds: selectedIds })
      handleOpenChange(false)
    } catch {
      // mutation toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加成员</DialogTitle>
          <DialogDescription>勾选一名或多名用户，一次性加入当前组织</DialogDescription>
        </DialogHeader>

        <InputGroup>
          <InputGroupInput
            placeholder="搜索姓名/邮箱/岗位"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex items-center justify-between gap-2 px-0.5">
          <Label
            htmlFor="org-add-members-select-all"
            className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground"
          >
            <Checkbox
              id="org-add-members-select-all"
              checked={allVisibleSelected}
              disabled={availableUsers.length === 0 || isFetching}
              onCheckedChange={(checked) => handleToggleAllVisible(checked === true)}
            />
            全选当前列表
          </Label>
          <span className="text-xs text-muted-foreground">
            {isFetching && debouncedKeyword.trim() ? '搜索中… · ' : null}
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

        <ScrollArea className="h-56">
          <ItemGroup className="gap-2 p-1 pr-2.5">
            {availableUsers.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                {isFetching ? '搜索中…' : keyword.trim() ? '没有匹配的用户' : '没有可添加的用户'}
              </p>
            ) : null}

            {availableUsers.map((user) => {
              const checked = selectedIds.includes(user.id)
              const checkboxId = `org-add-member-${user.id}`

              return (
                <Item
                  size="xs"
                  key={user.id}
                  variant="outline"
                  className="cursor-pointer rounded-2xl"
                  onClick={() => toggleUser(user.id, !checked)}
                >
                  <ItemMedia>
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      onCheckedChange={(next) => toggleUser(user.id, next === true)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`选择 ${user.name}`}
                    />
                  </ItemMedia>
                  <ItemMedia>
                    <Avatar className="size-10">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{user.name}</ItemTitle>
                    <ItemDescription>
                      {[user.title, user.email].filter(Boolean).join(' · ')}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              )
            })}
          </ItemGroup>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            disabled={addMembers.isPending || selectedCount === 0}
            onClick={() => {
              void handleSubmit()
            }}
          >
            {selectedCount > 0 ? `添加 ${selectedCount} 人` : '添加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
