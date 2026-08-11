import { Button, cn, Popover, PopoverContent, PopoverTrigger } from '@zen/ui'
import { ChevronsUpDown, Shapes } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useState } from 'react'

import { getRoleIconColorClassName, ROLE_ICONS } from '../data/data'

import type { RoleIconName } from '../data/data'
import type { RoleIconColor } from '../type'

type RoleIconPickerProps = {
  id?: string
  value: RoleIconName | null
  color?: RoleIconColor | null
  onValueChange: (value: RoleIconName | null) => void
  'aria-invalid'?: boolean
}

export function RoleIconPicker({
  id,
  value,
  color = null,
  onValueChange,
  'aria-invalid': ariaInvalid
}: RoleIconPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-empty={!value}
          aria-invalid={ariaInvalid}
          className="w-full justify-between font-normal data-[empty=true]:text-muted-foreground"
        >
          <span className="flex min-w-0 items-center gap-2">
            {value ? (
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  getRoleIconColorClassName(color)
                )}
              >
                <DynamicIcon name={value} className="size-3.5" aria-hidden />
              </span>
            ) : (
              <Shapes className="size-4 shrink-0" aria-hidden />
            )}
            <span className="truncate">{value ?? '选择角色图标'}</span>
          </span>
          <ChevronsUpDown data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <ul className="grid grid-cols-6 gap-1">
          {ROLE_ICONS.map((iconName) => {
            const selected = value === iconName

            return (
              <li key={iconName}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title={iconName}
                  aria-label={iconName}
                  aria-pressed={selected}
                  className={cn(
                    'size-full aspect-square',
                    selected && 'bg-muted-foreground/20 text-primary'
                  )}
                  onClick={() => {
                    onValueChange(iconName)
                    setOpen(false)
                  }}
                >
                  <DynamicIcon name={iconName} className="size-5" aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
        {value ? (
          <div className="mt-1 border-t pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onValueChange(null)
                setOpen(false)
              }}
            >
              清除图标
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
