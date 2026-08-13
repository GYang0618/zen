import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@zen/ui'
import { Check, ChevronsUpDown } from 'lucide-react'
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
  const { data: usersData, isFetching } = useOrganizationUserOptions(keyword, open)
  const users = usersData ?? EMPTY_USERS

  const selected =
    users.find((user) => user.id === value) ??
    (selectedUser?.id === value ? selectedUser : undefined)

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setKeyword('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.name}
              {selected.email ? (
                <span className="text-muted-foreground"> · {selected.email}</span>
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground">搜索用户姓名或邮箱</span>
          )}
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="搜索用户姓名或邮箱"
            value={keyword}
            onValueChange={setKeyword}
          />
          <CommandList>
            <CommandEmpty>{isFetching ? '搜索中…' : '没有找到匹配用户'}</CommandEmpty>
            <CommandGroup heading="用户">
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.id} ${user.name} ${user.email}`}
                  data-checked={value === user.id || undefined}
                  onSelect={() => {
                    onValueChange(user)
                    setOpen(false)
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[user.title, user.email].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {value === user.id ? <Check className="size-4 text-primary" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
