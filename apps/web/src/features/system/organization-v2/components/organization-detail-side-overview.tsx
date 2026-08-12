import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
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
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
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

function OrganizationPositionsCard() {
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

function OrganizationTimelineCard() {
  const data = [
    {
      time: '2026-08-03',
      title: '组织合并',
      description: '部门A合并到本部门'
    },
    {
      time: '2026-08-02',
      title: '负责人变更',
      description: '周明远变更为艾米丽'
    },
    {
      time: '2026-08-01',
      title: '部门名称变更',
      description: '部门名称从“A部门”变更为“B部门”'
    },
    {
      time: '2026-07-31',
      title: '创建组织',
      creator: '周明远',
      avatar: 'https://github.com/maxleiter.png'
    }
  ]

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <CardTitle>组织变更</CardTitle>
        <span>近7天</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Timeline>
          {data.map((item, index) => (
            <TimelineItem key={item.time}>
              <TimelineIndicator className={cn(index !== 0 && 'bg-primary border-none')}>
                {item.avatar && (
                  <Avatar>
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>{item.creator?.[0]}</AvatarFallback>
                  </Avatar>
                )}
              </TimelineIndicator>
              <TimelineConnector />
              <TimelineContent>
                <TimelineHeader>
                  <TimelineTitle>{item.title}</TimelineTitle>
                  <TimelineTimestamp>{item.time}</TimelineTimestamp>
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

export function OrganizationDetailSideOverview() {
  return (
    <aside className="bg-muted/35 flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed p-3 @5xl/content:w-90 @5xl/content:self-start">
      <OrganizationInfoCard />
      <OrganizationPositionsCard />
      <OrganizationTimelineCard />
    </aside>
  )
}
