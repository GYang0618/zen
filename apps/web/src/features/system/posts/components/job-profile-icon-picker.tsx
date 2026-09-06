import { Button, cn, Popover, PopoverContent, PopoverTrigger, ScrollArea } from '@zen/ui'
import { ChevronsUpDown, Shapes } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useState } from 'react'

import { getJobProfileIconColorClassName, JOB_PROFILE_ICONS } from '../data'

import type { JobProfileIcon, JobProfileIconColor } from '@zen/shared'

type JobProfileIconPickerProps = {
  id?: string
  value: JobProfileIcon | null
  color?: JobProfileIconColor | null
  onValueChange: (value: JobProfileIcon | null) => void
  'aria-invalid'?: boolean
}

export function JobProfileIconPicker({
  id,
  value,
  color = null,
  onValueChange,
  'aria-invalid': ariaInvalid
}: JobProfileIconPickerProps) {
  const [open, setOpen] = useState(false)
  const selectedIcon = JOB_PROFILE_ICONS.find((item) => item.value === value)

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
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
                  getJobProfileIconColorClassName(color)
                )}
              >
                <DynamicIcon name={value} className="size-3.5" aria-hidden />
              </span>
            ) : (
              <Shapes className="size-4 shrink-0" aria-hidden />
            )}
            <span className="truncate">{selectedIcon?.label ?? '选择岗位图标'}</span>
          </span>
          <ChevronsUpDown data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-2" align="start">
        <ScrollArea type="hover">
          <div className="flex max-h-56 flex-wrap gap-1">
            {JOB_PROFILE_ICONS.map((icon) => (
              <Button
                key={icon.value}
                type="button"
                size="icon"
                variant={value === icon.value ? 'default' : 'ghost'}
                title={icon.label}
                aria-label={icon.label}
                onClick={() => {
                  onValueChange(icon.value)
                  setOpen(false)
                }}
              >
                <DynamicIcon name={icon.value} className="size-5" aria-hidden />
              </Button>
            ))}
          </div>
        </ScrollArea>

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
