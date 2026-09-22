import { Badge as BaseBadge, cn } from '@zen/ui'
import { DynamicIcon } from 'lucide-react/dynamic'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { IconName } from 'lucide-react/dynamic'

export interface A2uiBadgeProps {
  text: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  icon?: string
  className?: string
}

export function Badge({ props }: RendererProps<A2uiBadgeProps>) {
  const { text, variant = 'default', icon, className } = props

  return (
    <BaseBadge variant={variant} className={cn('gap-1', className)}>
      {icon ? <DynamicIcon name={icon as IconName} className="size-3" /> : null}
      <span>{text}</span>
    </BaseBadge>
  )
}
