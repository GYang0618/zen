import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Timeline,
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
            <TimelineItem
              key={`${item.title}-${item.timestamp}`}
              active={item.active ?? index === 0}
            >
              <TimelineIndicator />
              <TimelineContent>
                <TimelineHeader>
                  <TimelineTitle className="font-semibold">{item.title}</TimelineTitle>
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
