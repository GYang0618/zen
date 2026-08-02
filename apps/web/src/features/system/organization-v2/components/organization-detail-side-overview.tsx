import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Progress,
  Separator,
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
} from '@zen/ui'
import { CalendarSync, Fingerprint, Mail, MapPin, Phone } from 'lucide-react'

function OrganizationInfoCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Fingerprint className="size-4" />
            组织编码
          </span>
          <span className="font-medium">PGE-0001</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            办公位置
          </span>
          <span className="max-w-32 truncate font-medium">办公楼 · 5F · 101</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarSync className="size-4" />
            最后更新时间
          </span>
          <span className="font-medium">2026-07-31</span>
        </div>

        <Separator />

        <div>
          <Item className="mb-5 p-0">
            <ItemMedia>
              <Avatar className="size-14">
                <AvatarImage src="https://github.com/maxleiter.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-lg leading-6">
                周明远
                <Badge variant="secondary" className="bg-green-300/50">
                  负责人
                </Badge>
              </ItemTitle>
              <ItemDescription className="leading-5">CEO · 首席执行官</ItemDescription>
            </ItemContent>
          </Item>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-md border px-3 py-1">
              <Mail className="size-4" />
              <span>brent.hunter@example.com</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border px-3 py-1">
              <Phone className="size-4" />
              <span>(+86)13800138000</span>
            </div>
          </div>
        </div>

        <Separator />
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary">年度优秀部门</Badge>
          <Badge variant="secondary">标签1</Badge>
          <Badge variant="secondary">标签2</Badge>
          <Badge variant="secondary">标签3</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function OrganizationMembersCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          岗位/编制使用 <Badge variant="secondary">1280 人</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field className="w-full max-w-sm">
          <FieldLabel htmlFor="progress text-sm">
            <span>{Math.round((1280 / 1500) * 100)}%</span>
            <span className="ml-auto text-muted-foreground">1280 / 1500</span>
          </FieldLabel>
          <Progress value={Math.round((1280 / 1500) * 100)} id="progress" />
          <FieldDescription className="flex items-center justify-between">
            <span>岗位空缺</span>
            <span>300人</span>
          </FieldDescription>
        </Field>
      </CardContent>
    </Card>
  )
}

function OrganizationTimelineEvent({
  name,
  action,
  time,
  avatarSrc,
  avatarAlt,
  description,
  badges,
  connector = true
}: {
  name: string
  action: string
  time: string
  avatarSrc: string
  avatarAlt: string
  description?: string
  badges?: Array<{ label: string; variant: 'secondary' | 'primary' }>
  connector?: boolean
}) {
  return (
    <TimelineItem connector={connector}>
      <TimelineIndicator>
        <Avatar className="size-6">
          <AvatarImage src={avatarSrc} alt={avatarAlt} />
          <AvatarFallback>{avatarAlt.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </TimelineIndicator>
      <TimelineContent>
        <TimelineHeader>
          <TimelineTitle>
            <span className="font-medium">{name}</span>{' '}
            <span className="font-normal">{action}</span>
          </TimelineTitle>
          <TimelineTimestamp className="text-sm">{time}</TimelineTimestamp>
        </TimelineHeader>
        {description ? (
          <TimelineDescription className="leading-5">{description}</TimelineDescription>
        ) : null}
        {badges && badges.length > 0 ? (
          <TimelineActions className="mt-1">
            {badges.map((badge) => (
              <Badge
                key={`${badge.variant}-${badge.label}`}
                variant="secondary"
                className={
                  badge.variant === 'primary' ? 'h-6 bg-primary/10 px-2 text-primary' : 'h-6 px-2'
                }
              >
                {badge.label}
              </Badge>
            ))}
          </TimelineActions>
        ) : null}
      </TimelineContent>
    </TimelineItem>
  )
}

function OrganizationTimelineCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近变更</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Timeline>
          <TimelineMarker>May 20, 2025</TimelineMarker>
          <OrganizationTimelineEvent
            name="Olivia Rhye"
            action="changed status"
            time="2:30 PM"
            avatarSrc="/avatars/avatar-1.png"
            avatarAlt="Olivia Rhye"
            badges={[
              { label: 'To Do', variant: 'secondary' },
              { label: 'In Progress', variant: 'primary' }
            ]}
          />
          <OrganizationTimelineEvent
            name="Olivia Rhye"
            action="updated labels"
            time="2:28 PM"
            avatarSrc="/avatars/avatar-1.png"
            avatarAlt="Olivia Rhye"
            badges={[
              { label: 'workflow', variant: 'secondary' },
              { label: 'assignment', variant: 'primary' }
            ]}
          />
          <OrganizationTimelineEvent
            name="Noah Kim"
            action="added a comment"
            time="10:24 AM"
            avatarSrc="/avatars/avatar-4.png"
            avatarAlt="Noah Kim"
            connector={false}
          />
          <TimelineMarker>May 18, 2025</TimelineMarker>
          <OrganizationTimelineEvent
            name="Noah Kim"
            action="moved subtask"
            time="4:15 PM"
            avatarSrc="/avatars/avatar-4.png"
            avatarAlt="Noah Kim"
            description="Build team-based assignee suggestions"
            badges={[
              { label: 'To Do', variant: 'secondary' },
              { label: 'Done', variant: 'primary' }
            ]}
            connector={false}
          />
          <TimelineMarker>May 16, 2025</TimelineMarker>
          <OrganizationTimelineEvent
            name="Olivia Rhye"
            action="created the issue"
            time="9:41 AM"
            avatarSrc="/avatars/avatar-1.png"
            avatarAlt="Olivia Rhye"
          />
        </Timeline>
      </CardContent>
    </Card>
  )
}

export function OrganizationDetailSideOverview() {
  return (
    <aside className="bg-muted/35 flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed p-3 @5xl/content:w-90 @5xl/content:self-start">
      <OrganizationInfoCard />
      <OrganizationMembersCard />
      <OrganizationTimelineCard />
    </aside>
  )
}
