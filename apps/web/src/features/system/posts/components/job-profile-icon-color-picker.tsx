import { Button, cn } from '@zen/ui'
import { Check } from 'lucide-react'

import { JOB_PROFILE_ICON_COLORS } from '../data'

import type { JobProfileIconColor } from '@zen/shared'

type JobProfileIconColorPickerProps = {
  id?: string
  value: JobProfileIconColor | null
  onValueChange: (value: JobProfileIconColor | null) => void
  'aria-invalid'?: boolean
}

export function JobProfileIconColorPicker({
  id,
  value,
  onValueChange,
  'aria-invalid': ariaInvalid
}: JobProfileIconColorPickerProps) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-invalid={ariaInvalid}
      aria-label="岗位图标颜色"
      className="flex flex-wrap gap-2"
    >
      {JOB_PROFILE_ICON_COLORS.map((color) => {
        const selected = value === color.value

        return (
          <Button
            key={color.value}
            type="button"
            role="radio"
            size="icon-sm"
            variant="outline"
            title={color.label}
            aria-label={color.label}
            aria-checked={selected}
            className={cn(
              'rounded-full border-transparent p-0',
              selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
            )}
            onClick={() => onValueChange(selected ? null : color.value)}
          >
            <span
              className={cn(
                'flex size-full items-center justify-center rounded-full',
                color.swatchClassName
              )}
            >
              {selected ? (
                <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden />
              ) : null}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
