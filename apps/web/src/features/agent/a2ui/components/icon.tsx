import { cn } from '@zen/ui'
import { HelpCircle } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { IconName } from 'lucide-react/dynamic'

export interface IconProps {
  name: string
  size?: number | string
  className?: string
  color?: string
}

function camelToKebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

export function A2uiDynamicIcon({
  name,
  size = 16,
  className,
  color,
  fallback
}: {
  name: string
  size?: number | string
  className?: string
  color?: string
  fallback?: () => React.JSX.Element
}) {
  if (!name) return null
  const normalizedName = camelToKebabCase(name) as IconName

  return (
    <span
      className={cn('inline-flex items-center justify-center shrink-0', className)}
      style={color ? { color } : undefined}
    >
      <DynamicIcon
        name={normalizedName}
        size={size}
        className="size-full"
        fallback={
          fallback ??
          (() => (
            <HelpCircle
              size={typeof size === 'number' ? size : 16}
              className="text-muted-foreground/60"
              aria-hidden
            />
          ))
        }
      />
    </span>
  )
}

export function Icon({ props }: RendererProps<IconProps>) {
  return <A2uiDynamicIcon {...props} />
}
