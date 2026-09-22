import {
  Progress as BaseProgress,
  cn,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue
} from '@zen/ui'

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
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label ? (
            <ProgressLabel className="font-medium text-foreground">{label}</ProgressLabel>
          ) : null}
          {showValue ? (
            <ProgressValue className="font-mono text-muted-foreground ml-auto">
              {percentage}%
            </ProgressValue>
          ) : null}
        </div>
      )}
      <BaseProgress value={percentage} className="w-full">
        <ProgressTrack className="h-2 w-full">
          <ProgressIndicator className="h-full bg-primary transition-all duration-300" />
        </ProgressTrack>
      </BaseProgress>
    </div>
  )
}
