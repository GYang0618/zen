import { Progress as BaseProgress, cn, ProgressLabel, ProgressValue } from '@zen/ui'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface A2uiProgressProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  className?: string
}

export function Progress({ props }: RendererProps<A2uiProgressProps>) {
  const { value, max = 100, label, showValue = true, className } = props
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)))

  return (
    <BaseProgress value={percentage} className={cn('w-full flex-col gap-1.5', className)}>
      {label || showValue ? (
        <div className="flex w-full items-center justify-between text-xs">
          {label ? (
            <ProgressLabel className="font-medium text-foreground">{label}</ProgressLabel>
          ) : null}
          {showValue ? (
            <ProgressValue className="ml-auto font-mono text-muted-foreground">
              {(formattedValue) => (formattedValue == null ? null : `${formattedValue}%`)}
            </ProgressValue>
          ) : null}
        </div>
      ) : null}
    </BaseProgress>
  )
}
