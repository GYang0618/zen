import { formatFromNow } from '@zen/shared'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineGroup,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineTimestamp,
  TimelineTitle
} from '@zen/ui'

import { useOrganizationActivities } from '../queries'

import type { ActivityGroup, OrganizationActivity as OrganizationActivityItem } from '../type'

function formatActivityDay(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function groupActivities(items: OrganizationActivityItem[]): ActivityGroup[] {
  const groups = new Map<string, ActivityGroup>()

  for (const item of items) {
    const groupKey = formatActivityDay(item.createdAt)
    const existing = groups.get(groupKey) ?? { group: groupKey, items: [] }
    existing.items.push({
      id: item.id,
      who: item.actor.name,
      title: item.title,
      avatar: item.actor.avatar ?? '',
      description: item.description,
      timestamp: formatFromNow(item.createdAt),
      changes: item.diff?.changes?.map((c) => ({
        label: c.label,
        from: c.from != null ? String(c.from) : null,
        to: c.to != null ? String(c.to) : null
      }))
    })
    groups.set(groupKey, existing)
  }

  return [...groups.values()]
}

const ACTIVITY_PAGE = { page: 1, pageSize: 50 } as const

export function OrganizationActivity({ organizationId }: { organizationId: string }) {
  const { data, isLoading } = useOrganizationActivities(organizationId, ACTIVITY_PAGE)
  const groups = groupActivities(data?.items ?? [])

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">加载活动…</p>
  }

  if (!groups.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">暂无活动记录</p>
  }

  return (
    <section>
      <Timeline>
        {groups.map((group) => (
          <TimelineGroup key={group.group}>
            <TimelineItem>
              <TimelineIndicator />
              <TimelineConnector />
              <TimelineContent>
                <TimelineTitle className="font-semibold">{group.group}</TimelineTitle>
              </TimelineContent>
            </TimelineItem>

            {group.items.map((item) => (
              <TimelineItem key={item.id}>
                <TimelineIndicator>
                  <Avatar>
                    <AvatarImage src={item.avatar || undefined} alt={item.who} />
                    <AvatarFallback>{item.who.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </TimelineIndicator>
                <TimelineConnector />
                <TimelineContent>
                  <TimelineHeader>
                    <TimelineTitle className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                      <span>{item.who}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {item.title}
                      </span>
                    </TimelineTitle>
                    <TimelineTimestamp>{item.timestamp}</TimelineTimestamp>
                  </TimelineHeader>
                  <TimelineDescription>{item.description}</TimelineDescription>
                  {item.changes && item.changes.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-2 text-xs">
                      {item.changes.map((change, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-muted-foreground font-medium">
                            {change.label}：
                          </span>
                          <span className="line-through text-muted-foreground/70 decoration-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded">
                            {change.from || '无'}
                          </span>
                          <span className="text-muted-foreground">➔</span>
                          <span className="bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">
                            {change.to || '无'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </TimelineContent>
              </TimelineItem>
            ))}
          </TimelineGroup>
        ))}
      </Timeline>
    </section>
  )
}
