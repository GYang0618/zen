import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineTimestamp,
  TimelineTitle
} from '@zen/ui'

import type { ReactNode } from 'react'

export type RoleAuditTimelineItem = {
  actor: string
  title: string
  description: ReactNode
  timestamp: string
  active?: boolean
}

export function RoleAuditTimelineCard({ data }: { data: RoleAuditTimelineItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>审计日志</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline>
          {data.map((item, index) => (
            <TimelineItem key={`${item.actor}-${item.title}-${item.timestamp}-${index}`}>
              <TimelineIndicator
                className={(item.active ?? index === 0) ? 'bg-foreground border-0' : undefined}
                aria-hidden
              />
              <TimelineConnector />
              <TimelineContent>
                <TimelineHeader>
                  <TimelineTitle className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                    <span>{item.actor}</span>
                    <span className="text-xs font-normal text-muted-foreground">{item.title}</span>
                  </TimelineTitle>
                  <TimelineTimestamp>{item.timestamp}</TimelineTimestamp>
                </TimelineHeader>
                <TimelineDescription>{item.description}</TimelineDescription>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}
