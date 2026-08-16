import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useOverlayPortalContainer
} from '@zen/ui'
import { useState } from 'react'

import { useOrganizationUserOptions } from '../queries'

import type { OrganizationUserOption } from '../type'

const EMPTY_USERS: OrganizationUserOption[] = []

interface OrganizationLeaderSelectProps {
  id?: string
  value?: string
  selectedUser?: OrganizationUserOption
  onValueChange: (user: OrganizationUserOption) => void
  'aria-invalid'?: boolean
}

export function OrganizationLeaderSelect({
  id,
  value,
  selectedUser,
  onValueChange,
  'aria-invalid': ariaInvalid
}: OrganizationLeaderSelectProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [pickedUser, setPickedUser] = useState(selectedUser)
  const [setInputAnchor, portalContainer] = useOverlayPortalContainer<HTMLInputElement>()
  const { data: usersData, isFetching } = useOrganizationUserOptions(keyword, open)
  const users = usersData ?? EMPTY_USERS

  const selected =
    users.find((user) => user.id === value) ?? (pickedUser?.id === value ? pickedUser : undefined)

  return (
    <Combobox
      items={users}
      filteredItems={users}
      value={selected ?? null}
      // 展开时输入框承载搜索词，收起后回落为已选负责人，避免远程结果变化冲掉展示文案
      inputValue={open ? keyword : (selected?.name ?? '')}
      onInputValueChange={setKeyword}
      itemToStringLabel={(user) => user.name}
      itemToStringValue={(user) => user.id}
      isItemEqualToValue={(user, current) => user.id === current.id}
      onValueChange={(user) => {
        if (!user) return
        setPickedUser(user)
        onValueChange(user)
      }}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) setKeyword('')
      }}
    >
      <ComboboxInput
        ref={setInputAnchor}
        id={id}
        className="w-full"
        placeholder="搜索用户姓名或邮箱"
        aria-invalid={ariaInvalid}
        autoComplete="off"
      />
      <ComboboxContent container={portalContainer}>
        <ComboboxEmpty>{isFetching ? '搜索中…' : '没有找到匹配用户'}</ComboboxEmpty>
        <ComboboxList>
          {users.map((user) => (
            <ComboboxItem key={user.id} value={user}>
              <Avatar>
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[user.title, user.email].filter(Boolean).join(' · ')}
                </p>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
