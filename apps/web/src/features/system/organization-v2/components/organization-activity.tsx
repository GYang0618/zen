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

import type { ActivityGroup, OrganizationActivity } from '../type'

function formatActivityTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function formatActivityDay(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function groupActivities(items: OrganizationActivity[]): ActivityGroup[] {
  const groups = new Map<string, ActivityGroup>()

  for (const item of items) {
    const groupKey = formatActivityDay(item.createdAt)
    const existing = groups.get(groupKey) ?? { group: groupKey, items: [] }
    existing.items.push({
      who: item.actor.name,
      action: item.action,
      avatar: item.actor.avatar ?? '',
      description: item.description,
      timestamp: formatActivityTime(item.createdAt)
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
              <TimelineItem key={`${group.group}-${item.who}-${item.timestamp}-${item.action}-${item.description}`}>
                <TimelineIndicator>
                  <Avatar>
                    <AvatarImage src={item.avatar || undefined} alt={item.who} />
                    <AvatarFallback>{item.who.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                </TimelineIndicator>
                <TimelineConnector />
                <TimelineContent>
                  <TimelineHeader>
                    <TimelineTitle className="font-normal">
                      <span className="font-medium">{item.who}</span> {item.action}
                    </TimelineTitle>

                    <TimelineTimestamp>{item.timestamp}</TimelineTimestamp>
                  </TimelineHeader>
                  <TimelineDescription>{item.description}</TimelineDescription>
                </TimelineContent>
              </TimelineItem>
            ))}
          </TimelineGroup>
        ))}
      </Timeline>
    </section>
  )
}
