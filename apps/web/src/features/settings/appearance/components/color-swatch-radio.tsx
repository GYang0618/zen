import { cn, RadioGroupItem } from '@zen/ui'
import { Check } from 'lucide-react'

import type { ColorSwatchOption } from '../types'

export function ColorSwatchRadio({ name, option }: { name: string; option: ColorSwatchOption }) {
  const optionId = `${name}-${option.value}`

  return (
    <label
      htmlFor={optionId}
      className="group/color-swatch flex cursor-pointer flex-col items-center gap-1.5"
    >
      <span
        className={cn(
          'flex size-8 items-center justify-center rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition-all',
          'group-has-data-checked/color-swatch:ring-foreground',
          option.swatchClassName
        )}
        aria-hidden
      >
        <Check
          className={cn(
            'size-3.5 opacity-0 transition-opacity group-has-data-checked/color-swatch:opacity-100',
            option.checkClassName
          )}
        />
      </span>
      <span className="text-xs font-normal">{option.label}</span>
      <RadioGroupItem value={option.value} id={optionId} className="sr-only" />
    </label>
  )
}
