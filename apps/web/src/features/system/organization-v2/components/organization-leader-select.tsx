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

import { organizationUsers } from '../data/mock'

import type { OrganizationUserOption } from '../type'

interface OrganizationLeaderSelectProps {
  id?: string
  value?: string
  onValueChange: (user: OrganizationUserOption) => void
  'aria-invalid'?: boolean
}

export function OrganizationLeaderSelect({
  id,
  value,
  onValueChange,
  'aria-invalid': ariaInvalid
}: OrganizationLeaderSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = organizationUsers.find((user) => user.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
              <span className="text-muted-foreground"> · {selected.email}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">搜索用户姓名或邮箱</span>
          )}
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索用户姓名或邮箱" />
          <CommandList>
            <CommandEmpty>没有找到匹配用户</CommandEmpty>
            <CommandGroup heading="用户">
              {organizationUsers.map((user) => (
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
                      {user.title} · {user.email}
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
