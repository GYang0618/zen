import {
  Button,
  Checkbox,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea
} from '@zen/ui'
import { ChevronsUpDown, Search, Shield } from 'lucide-react'
import { useMemo, useState } from 'react'

import { UserRoleIcon } from './user-role-icon'

import type { Role } from '@zen/shared'

type UserRolePickerProps = {
  id?: string
  roles: Role[]
  value: string[]
  onValueChange: (roleIds: string[]) => void
  disabled?: boolean
}

export function UserRolePicker({
  id,
  roles,
  value,
  onValueChange,
  disabled = false
}: UserRolePickerProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const selectedRoles = roles.filter((role) => value.includes(role.id))
  const selectedLabel = selectedRoles.map((role) => role.name).join('、')

  const visibleRoles = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return roles
    return roles.filter((role) =>
      [role.name, role.code, role.description].some((text) =>
        (text ?? '').toLowerCase().includes(query)
      )
    )
  }, [keyword, roles])

  const toggleRole = (roleId: string, checked: boolean) => {
    onValueChange(checked ? [...value, roleId] : value.filter((id) => id !== roleId))
  }

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
          disabled={disabled}
          data-empty={selectedRoles.length === 0}
          className="w-full justify-between font-normal data-[empty=true]:text-muted-foreground"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selectedRoles.length === 0 ? <Shield aria-hidden /> : null}
            <span className="truncate">{selectedLabel || '选择角色'}</span>
          </span>
          <ChevronsUpDown data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-2" align="start">
        <InputGroup>
          <InputGroupInput
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索角色"
            aria-label="搜索角色"
            autoComplete="off"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <ScrollArea type="hover">
          {visibleRoles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">没有找到匹配角色</p>
          ) : (
            <ItemGroup className="max-h-60 gap-1.5 pr-2">
              {visibleRoles.map((role) => {
                const checked = value.includes(role.id)

                return (
                  <Item
                    key={role.id}
                    asChild
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    <label htmlFor={`create-role-${role.id}`}>
                      <ItemMedia>
                        <Checkbox
                          id={`create-role-${role.id}`}
                          checked={checked}
                          onCheckedChange={(next) => toggleRole(role.id, next === true)}
                          aria-label={`选择 ${role.name}`}
                        />
                      </ItemMedia>
                      <ItemMedia>
                        <UserRoleIcon
                          className="size-6 rounded-md"
                          icon={role.icon}
                          iconColor={role.iconColor}
                        />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="min-w-0">
                          <span className="truncate">{role.name}</span>
                          <span className="font-mono text-xs font-normal text-muted-foreground">
                            {role.code}
                          </span>
                        </ItemTitle>
                        <ItemDescription>{role.description || '该角色暂无描述'}</ItemDescription>
                      </ItemContent>
                    </label>
                  </Item>
                )
              })}
            </ItemGroup>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
