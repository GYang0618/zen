import { cn } from '@zen/ui/lib/utils'
import { cva } from 'class-variance-authority'

import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'

function Timeline({ className, ...props }: React.ComponentProps<'ol'>) {
  return <ol data-slot="timeline" className={cn('flex flex-col gap-5', className)} {...props} />
}

function TimelineItem({
  className,
  connector = true,
  active = false,
  ...props
}: React.ComponentProps<'li'> & {
  /** 是否向下延伸连接线；末条子项会自动截断 */
  connector?: boolean
  /** 高亮左侧圆点（无自定义 media 时生效） */
  active?: boolean
}) {
  return (
    <li
      data-slot="timeline-item"
      data-connector={connector ? 'true' : 'false'}
      data-active={active ? 'true' : undefined}
      className={cn('group/timeline-item relative flex gap-x-4', className)}
      {...props}
    />
  )
}

const timelineIndicatorDotVariants = cva('rounded-full', {
  variants: {
    variant: {
      default:
        'size-2.5 bg-muted-foreground/40 group-data-[active=true]/timeline-item:bg-foreground',
      marker: 'size-2 bg-background ring-2 ring-border'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

function TimelineIndicator({
  className,
  variant = 'default',
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof timelineIndicatorDotVariants>) {
  return (
    <div
      data-slot="timeline-indicator"
      className={cn('relative flex w-6 flex-none justify-center', className)}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          'absolute top-0 left-1/2 w-px -translate-x-1/2 bg-border',
          '-bottom-5',
          'group-last/timeline-item:bottom-auto group-last/timeline-item:h-6',
          'group-data-[connector=false]/timeline-item:bottom-auto group-data-[connector=false]/timeline-item:h-6'
        )}
      />
      <div className="relative z-10 flex size-6 items-center justify-center bg-background">
        {children ?? (
          <span
            data-slot="timeline-indicator-dot"
            data-variant={variant}
            className={cn(timelineIndicatorDotVariants({ variant }))}
          />
        )}
      </div>
    </div>
  )
}

function TimelineContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-content"
      className={cn('flex min-w-0 flex-auto flex-col gap-1', className)}
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
    <div
      data-slot="timeline-title"
      className={cn('min-w-0 text-sm leading-snug font-medium', className)}
      {...props}
    />
  )
}

function TimelineDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-description"
      className={cn('text-sm leading-6 text-muted-foreground', className)}
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

function TimelineMarker({ className, children, ...props }: React.ComponentProps<'li'>) {
  return (
    <TimelineItem className={className} {...props}>
      <TimelineIndicator variant="marker" />
      <TimelineContent>
        <TimelineTitle className="py-0.5 font-semibold">{children}</TimelineTitle>
      </TimelineContent>
    </TimelineItem>
  )
}

export {
  Timeline,
  TimelineActions,
  TimelineContent,
  TimelineDescription,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineMarker,
  TimelineTimestamp,
  TimelineTitle
}
