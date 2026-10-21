import { RadioGroupItem } from '@zen/ui'

import type { AppearanceOption } from '../types'

export function AppearanceIconRadio({
  name,
  option,
  tintIcon = true
}: {
  name: string
  option: AppearanceOption
  tintIcon?: boolean
}) {
  const optionId = `${name}-${option.value}`

  return (
    <label
      htmlFor={optionId}
      className="group/appearance-option flex cursor-pointer flex-col items-center gap-1.5"
    >
      <div className="rounded-lg border-2 transition-all duration-200 ease-in group-has-data-checked/appearance-option:border-primary group-has-data-checked/appearance-option:bg-primary/5 dark:group-has-data-checked/appearance-option:border-primary/30 dark:group-has-data-checked/appearance-option:bg-primary/10 overflow-hidden">
        <option.icon
          className={
            tintIcon
              ? 'h-auto w-45 fill-muted-foreground stroke-muted-foreground group-has-data-checked/appearance-option:fill-primary group-has-data-checked/appearance-option:stroke-primary'
              : 'h-auto w-45'
          }
        />
      </div>
      <span className="text-xs font-normal">{option.label}</span>
      <RadioGroupItem value={option.value} id={optionId} className="sr-only" />
    </label>
  )
}
