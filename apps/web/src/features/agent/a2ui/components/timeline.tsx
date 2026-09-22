import {
  Timeline as BaseTimeline,
  cn,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSide,
  TimelineTimestamp,
  TimelineTitle
} from '@zen/ui'
import { CheckCircle2, CircleAlert, CircleDot, Clock, Info, XCircle } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { IconName } from 'lucide-react/dynamic'
import type { ReactNode } from 'react'

export interface TimelineItemData {
  title: string
  description?: string
  timestamp?: string
  status?: 'default' | 'success' | 'warning' | 'error' | 'info'
  icon?: string
  side?: string
}

export interface A2uiTimelineProps {
  items: TimelineItemData[]
  className?: string
}

function resolveIndicator(status?: string, icon?: string): ReactNode {
  if (icon) {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-foreground ring-2 ring-background">
        <DynamicIcon name={icon as IconName} className="size-3.5" />
      </span>
    )
  }

  switch (status) {
    case 'success':
      return <CheckCircle2 className="size-4 text-emerald-500" />
    case 'warning':
      return <CircleAlert className="size-4 text-amber-500" />
    case 'error':
      return <XCircle className="size-4 text-destructive" />
    case 'info':
      return <Info className="size-4 text-sky-500" />
    default:
      return <CircleDot className="size-3.5 text-muted-foreground" />
  }
}

export function Timeline({ props }: RendererProps<A2uiTimelineProps>) {
  const { items = [], className } = props

  if (!items.length) {
    return <div className="py-6 text-center text-xs text-muted-foreground">暂无时间线记录</div>
  }

  return (
    <BaseTimeline className={cn('p-2 w-full', className)}>
      {items.map((item, index) => (
        <TimelineItem key={`${item.title}-${index}`}>
          {item.side ? <TimelineSide>{item.side}</TimelineSide> : null}
          <TimelineIndicator className="mt-0">
            {resolveIndicator(item.status, item.icon)}
          </TimelineIndicator>
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
              <TimelineDescription className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </TimelineDescription>
            ) : null}
          </TimelineContent>
        </TimelineItem>
      ))}
    </BaseTimeline>
  )
}
