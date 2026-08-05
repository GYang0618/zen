import { cn } from '@zen/ui/lib/utils'

import type * as React from 'react'

function Timeline({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline"
      className={cn(
        'group/timeline grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-4',
        // 直接子项末项、以及每个 Group 的末项：不向下连线（组与组之间断开）
        '*:data-[slot=timeline-item]:last:**:data-[slot=timeline-connector]:hidden',
        '*:data-[slot=timeline-group]:*:data-[slot=timeline-item]:last:**:data-[slot=timeline-connector]:hidden',
        className
      )}
      {...props}
    />
  )
}

function TimelineGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-group"
      className={cn('group/timeline-group col-span-3 grid grid-cols-subgrid gap-y-4', className)}
      {...props}
    />
  )
}

function TimelineItem({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-item"
      className={cn('relative col-span-3 grid grid-cols-subgrid items-start', className)}
      {...props}
    />
  )
}

function TimelineSide({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-side"
      className={cn(
        'col-start-1 row-start-1 w-max justify-self-end pt-px text-right text-xs leading-tight text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

function TimelineIndicator({ className, children, ...props }: React.ComponentProps<'div'>) {
  const isDefaultDot = children == null

  return (
    <div
      data-slot="timeline-indicator"
      className={cn(
        // 定位 + ring 盖住连接线，形成节点上下空隙
        'relative z-10 col-start-2 row-start-1 justify-self-center rounded-full bg-background ring-4 ring-background',
        isDefaultDot
          ? // 无 children：自身即默认点
            'mt-1.5 size-2.5 border-2 border-border'
          : // 有 children：作为定位容器直接渲染子节点
            'mt-0.5 inline-flex shrink-0 items-center justify-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TimelineConnector({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-connector"
      className={cn(
        'col-start-2 row-start-1 -mb-4 w-px justify-self-center self-stretch bg-border',
        className
      )}
      {...props}
    />
  )
}

function TimelineContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-content"
      className={cn('col-start-3 row-start-1 flex min-w-0 flex-col gap-1 text-sm', className)}
      {...props}
    />
  )
}

function TimelineHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-header"
      className={cn('flex items-baseline justify-between gap-3', className)}
      {...props}
    />
  )
}

function TimelineTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="timeline-title" className={cn('min-w-0 font-medium', className)} {...props} />
  )
}

function TimelineDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-description"
      className={cn('text-muted-foreground leading-6', className)}
      {...props}
    />
  )
}

function TimelineTimestamp({ className, ...props }: React.ComponentProps<'time'>) {
  return (
    <time
      data-slot="timeline-timestamp"
      className={cn('shrink-0 text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

function TimelineActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-actions"
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    />
  )
}

export {
  Timeline,
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
}
