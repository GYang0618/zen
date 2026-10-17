import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Timeline as BaseTimeline,
  Button,
  cn,
  TimelineActions,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineGroup,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSide,
  TimelineTimestamp,
  TimelineTitle
} from '@zen/ui'
import { CheckCircle2, CircleAlert, Clock, Info, XCircle } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useMemo } from 'react'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { IconName } from 'lucide-react/dynamic'
import type { ReactNode } from 'react'

export type TimelineVariant = 'auto' | 'dot' | 'solid-dot' | 'icon' | 'avatar'

export interface TimelineActionItem {
  label: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  action?: string
}

export interface TimelineChangeItem {
  label: string
  from?: string | null
  to?: string | null
}

export interface TimelineAvatarData {
  src?: string
  name?: string
  fallback?: string
}

export interface TimelineItemData {
  title: string
  description?: string
  timestamp?: string
  status?: 'default' | 'success' | 'warning' | 'error' | 'info'
  icon?: string
  iconColor?: string
  iconBg?: string
  avatar?: string | TimelineAvatarData
  side?: string
  group?: string
  variant?: TimelineVariant
  changes?: TimelineChangeItem[]
  actions?: TimelineActionItem[]
}

export interface TimelineGroupData {
  group: string
  items: TimelineItemData[]
}

export interface A2uiTimelineProps {
  variant?: TimelineVariant
  items?: TimelineItemData[]
  groups?: TimelineGroupData[]
  className?: string
}

function resolveIndicator(
  item: TimelineItemData,
  rootVariant: TimelineVariant = 'auto'
): ReactNode {
  const variant = item.variant ?? (rootVariant !== 'auto' ? rootVariant : undefined)

  // 1. 头像模式 (avatar)
  if (variant === 'avatar' || (!variant && item.avatar)) {
    const avatarData =
      typeof item.avatar === 'string'
        ? { src: item.avatar, name: item.title }
        : (item.avatar ?? { name: item.title })
    const fallback =
      avatarData.fallback ??
      (avatarData.name ? avatarData.name.trim().slice(0, 1).toUpperCase() : 'U')

    return (
      <TimelineIndicator className="mt-0">
        <Avatar size="sm" className="size-6">
          <AvatarImage src={avatarData.src} alt={avatarData.name ?? item.title} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </TimelineIndicator>
    )
  }

  // 2. 图标模式 (icon)
  if (variant === 'icon' || (!variant && item.icon)) {
    const iconName = (item.icon ?? 'circle') as IconName
    if (item.iconBg || !variant) {
      return (
        <TimelineIndicator className="size-6 mt-0">
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-full ring-2 ring-background',
              item.iconBg ?? 'bg-muted text-foreground'
            )}
          >
            <DynamicIcon name={iconName} className={cn('size-3.5', item.iconColor)} />
          </span>
        </TimelineIndicator>
      )
    }

    return (
      <TimelineIndicator className="size-6 mt-0">
        <DynamicIcon
          name={iconName}
          className={cn('size-4 text-muted-foreground', item.iconColor)}
        />
      </TimelineIndicator>
    )
  }

  // 3. 实心彩色点模式 (solid-dot)
  if (variant === 'solid-dot') {
    const solidColorMap: Record<string, string> = {
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      error: 'bg-destructive',
      info: 'bg-sky-500',
      default: 'bg-primary'
    }
    const bgClass = solidColorMap[item.status ?? 'default'] ?? 'bg-primary'
    return <TimelineIndicator className={cn('border-0 mt-1.5', bgClass)} aria-hidden />
  }

  // 4. 空心点模式 (dot)
  if (variant === 'dot') {
    const borderColorMap: Record<string, string> = {
      success: 'border-emerald-500',
      warning: 'border-amber-500',
      error: 'border-destructive',
      info: 'border-sky-500',
      default: 'border-border'
    }
    const borderClass = borderColorMap[item.status ?? 'default'] ?? 'border-border'
    return <TimelineIndicator className={cn('mt-1.5', borderClass)} />
  }

  // 5. 自动推导 (auto)
  if (item.status && item.status !== 'default') {
    switch (item.status) {
      case 'success':
        return (
          <TimelineIndicator className="mt-0">
            <CheckCircle2 className="size-4 text-emerald-500" />
          </TimelineIndicator>
        )
      case 'warning':
        return (
          <TimelineIndicator className="mt-0">
            <CircleAlert className="size-4 text-amber-500" />
          </TimelineIndicator>
        )
      case 'error':
        return (
          <TimelineIndicator className="mt-0">
            <XCircle className="size-4 text-destructive" />
          </TimelineIndicator>
        )
      case 'info':
        return (
          <TimelineIndicator className="mt-0">
            <Info className="size-4 text-sky-500" />
          </TimelineIndicator>
        )
    }
  }

  return <TimelineIndicator className="mt-1.5" />
}

function renderTimelineItem(
  item: TimelineItemData,
  index: number,
  variant: TimelineVariant = 'auto'
) {
  return (
    <TimelineItem key={`${item.title}-${index}`}>
      {item.side ? (
        <TimelineSide className="font-medium text-muted-foreground">{item.side}</TimelineSide>
      ) : null}
      {resolveIndicator(item, variant)}
      <TimelineConnector />
      <TimelineContent className="pb-4">
        <TimelineHeader>
          <TimelineTitle className="text-sm font-semibold text-foreground">
            {item.title}
          </TimelineTitle>
          {item.timestamp ? (
            <TimelineTimestamp className="flex items-center gap-1 font-mono text-xs">
              <Clock className="size-3 shrink-0" />
              {item.timestamp}
            </TimelineTimestamp>
          ) : null}
        </TimelineHeader>
        {item.description ? (
          <TimelineDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {item.description}
          </TimelineDescription>
        ) : null}
        {item.changes && item.changes.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1.5 rounded-md border bg-muted/20 p-2 text-xs">
            {item.changes.map((change, idx) => (
              <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground font-medium">{change.label}：</span>
                {change.from ? (
                  <span className="line-through text-muted-foreground/70 decoration-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded">
                    {change.from}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60 italic">无</span>
                )}
                <span className="text-muted-foreground">➔</span>
                <span className="bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">
                  {change.to || '无'}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {item.actions && item.actions.length > 0 ? (
          <TimelineActions className="mt-2">
            {item.actions.map((act, idx) => (
              <Button
                key={idx}
                type="button"
                size="sm"
                variant={act.variant ?? 'outline'}
                className="h-7 text-xs"
              >
                {act.label}
              </Button>
            ))}
          </TimelineActions>
        ) : null}
      </TimelineContent>
    </TimelineItem>
  )
}

export function Timeline({ props }: RendererProps<A2uiTimelineProps>) {
  const { items = [], groups, variant = 'auto', className } = props

  const normalizedGroups = useMemo(() => {
    if (groups && groups.length > 0) return groups
    if (!items.length) return null

    const hasGroups = items.some((item) => Boolean(item.group))
    if (!hasGroups) return null

    const map = new Map<string, TimelineItemData[]>()
    for (const item of items) {
      const g = item.group ?? '其它'
      const list = map.get(g) ?? []
      list.push(item)
      map.set(g, list)
    }

    return [...map.entries()].map(([group, groupItems]) => ({
      group,
      items: groupItems
    }))
  }, [groups, items])

  const totalCount = normalizedGroups
    ? normalizedGroups.reduce((acc, g) => acc + g.items.length, 0)
    : items.length

  if (totalCount === 0) {
    return <div className="py-6 text-center text-xs text-muted-foreground">暂无时间线记录</div>
  }

  return (
    <BaseTimeline className={cn('p-2 w-full', className)}>
      {normalizedGroups
        ? normalizedGroups.map((group) => (
            <TimelineGroup key={group.group}>
              <TimelineItem>
                <TimelineIndicator className="mt-1.5" />
                <TimelineConnector />
                <TimelineContent>
                  <TimelineTitle className="py-0.5 font-semibold text-foreground text-sm">
                    {group.group}
                  </TimelineTitle>
                </TimelineContent>
              </TimelineItem>
              {group.items.map((item, index) => renderTimelineItem(item, index, variant))}
            </TimelineGroup>
          ))
        : items.map((item, index) => renderTimelineItem(item, index, variant))}
    </BaseTimeline>
  )
}
