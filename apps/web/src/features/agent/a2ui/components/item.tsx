import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Item as BaseItem,
  ItemGroup as BaseItemGroup,
  cn,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@zen/ui'
import { DynamicIcon } from 'lucide-react/dynamic'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { IconName } from 'lucide-react/dynamic'

export interface A2uiItemProps {
  title: string
  description?: string
  icon?: string
  avatar?: string
  badge?: string
  extra?: string
  variant?: 'default' | 'outline' | 'muted'
  className?: string
}

export function Item({ props }: RendererProps<A2uiItemProps>) {
  const { title, description, icon, avatar, badge, extra, variant = 'default', className } = props

  return (
    <BaseItem variant={variant} className={cn('w-full', className)}>
      {(icon || avatar) && (
        <ItemMedia variant={avatar ? 'image' : 'icon'}>
          {avatar ? (
            <Avatar size="sm" className="size-8">
              <AvatarImage src={avatar} alt={title} />
              <AvatarFallback className="text-[10px]">
                {title.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : icon ? (
            <div className="flex size-7 items-center justify-center rounded-md border bg-muted/50 text-foreground">
              <DynamicIcon name={icon as IconName} className="size-4" />
            </div>
          ) : null}
        </ItemMedia>
      )}

      <ItemContent>
        <ItemTitle className="text-foreground">{title}</ItemTitle>
        {description && <ItemDescription>{description}</ItemDescription>}
      </ItemContent>

      {(badge || extra) && (
        <ItemActions>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
          {extra && <span className="text-xs text-muted-foreground font-mono">{extra}</span>}
        </ItemActions>
      )}
    </BaseItem>
  )
}

export interface A2uiItemGroupProps {
  children?: string[]
  className?: string
}

export function ItemGroup({ props, children }: RendererProps<A2uiItemGroupProps>) {
  const { children: childIds = [], className } = props

  return (
    <BaseItemGroup className={cn('w-full flex flex-col gap-2', className)}>
      {childIds.map((id) => (
        <div key={id} className="w-full">
          {children(id)}
        </div>
      ))}
    </BaseItemGroup>
  )
}
