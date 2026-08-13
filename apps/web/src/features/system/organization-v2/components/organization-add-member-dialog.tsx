import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
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
  ItemTitle
} from '@zen/ui'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useAddOrganizationMember, useOrganizationUserOptions } from '../queries'

import type { OrganizationUserOption } from '../type'

type OrganizationAddMemberDialogProps = {
  organizationId: string
  memberIds: ReadonlySet<string>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrganizationAddMemberDialog({
  organizationId,
  memberIds,
  open,
  onOpenChange
}: OrganizationAddMemberDialogProps) {
  const [keyword, setKeyword] = useState('')
  const addMember = useAddOrganizationMember(organizationId)
  const { data, isFetching } = useOrganizationUserOptions(keyword, open)

  const users = useMemo(() => {
    const list = data ?? []
    return [...list].sort((a, b) => Number(memberIds.has(a.id)) - Number(memberIds.has(b.id)))
  }, [data, memberIds])

  const handleBindMember = async (user: OrganizationUserOption) => {
    if (memberIds.has(user.id) || addMember.isPending) return
    try {
      await addMember.mutateAsync({ userId: user.id })
      onOpenChange(false)
    } catch {
      // mutation toast
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setKeyword('')
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加成员</DialogTitle>
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

        <div className="h-56 overflow-y-auto pr-2.5">
          <ItemGroup>
            {users.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                {isFetching ? '搜索中…' : '没有匹配的用户'}
              </p>
            ) : null}

            {users.map((user) => {
              const isBound = memberIds.has(user.id)

              return (
                <Item size="xs" key={user.id} variant="outline" className="rounded-2xl">
                  <ItemMedia>
                    <Avatar className="size-10">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>

                  <ItemContent>
                    <ItemTitle>{user.name}</ItemTitle>
                    <ItemDescription>
                      {[user.title, user.email].filter(Boolean).join(' · ')}
                    </ItemDescription>
                  </ItemContent>

                  <ItemActions>
                    <Button
                      type="button"
                      size="sm"
                      variant={isBound ? 'outline' : 'default'}
                      disabled={isBound || addMember.isPending}
                      onClick={() => void handleBindMember(user)}
                    >
                      {isBound ? '已添加' : '添加'}
                    </Button>
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        </div>
      </DialogContent>
    </Dialog>
  )
}
