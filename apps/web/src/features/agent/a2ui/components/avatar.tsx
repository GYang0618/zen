import { AvatarBadge, AvatarFallback, AvatarImage, Avatar as BaseAvatar, cn } from '@zen/ui'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface A2uiAvatarProps {
  src?: string
  name?: string
  fallback?: string
  size?: 'sm' | 'default' | 'lg'
  badge?: string | boolean
  className?: string
}

export function Avatar({ props }: RendererProps<A2uiAvatarProps>) {
  const { src, name, fallback, size = 'default', badge, className } = props
  const computedFallback = fallback ?? (name ? name.slice(0, 1).toUpperCase() : '?')

  return (
    <BaseAvatar size={size} className={cn('shrink-0', className)}>
      {src ? <AvatarImage src={src} alt={name ?? ''} /> : null}
      <AvatarFallback className="font-medium text-xs">{computedFallback}</AvatarFallback>
      {badge ? <AvatarBadge>{typeof badge === 'string' ? badge : null}</AvatarBadge> : null}
    </BaseAvatar>
  )
}
