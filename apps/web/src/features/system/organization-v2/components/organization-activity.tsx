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

import type { ActivityGroup } from '../type'

type OrganizationActivityProps = {
  data: ActivityGroup[]
}

export function OrganizationActivity({ data }: OrganizationActivityProps) {
  return (
    <section>
      <Timeline>
        {data.map((group) => (
          <TimelineGroup key={group.group}>
            <TimelineItem>
              <TimelineIndicator />
              <TimelineConnector />
              <TimelineContent>
                <TimelineTitle className="font-semibold">{group.group}</TimelineTitle>
              </TimelineContent>
            </TimelineItem>

            {group.items.map((item) => (
              <TimelineItem key={`${group.group}-${item.who}-${item.timestamp}-${item.action}`}>
                <TimelineIndicator>
                  <Avatar>
                    <AvatarImage src={item.avatar} alt={item.who} />
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
