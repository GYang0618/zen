import { Card, CardContent, CardHeader, CardTitle } from '@zen/ui'

import { Timeline } from './timeline'

import type { TimelineItem } from './timeline'

export function RoleAuditTimelineCard({ data }: { data: TimelineItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>审计日志</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline items={data} />
      </CardContent>
    </Card>
  )
}
