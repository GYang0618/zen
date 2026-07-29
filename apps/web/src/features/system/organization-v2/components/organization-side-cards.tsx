import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import { Building2, CalendarClock, MapPin, UserRound } from 'lucide-react'

import type { OrganizationNode } from '../data'

export function OrganizationInfoCard({ organization }: { organization: OrganizationNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 />
            组织类型
          </span>
          <span className="font-medium">{organization.type}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound />
            负责人
          </span>
          <span className="font-medium">{organization.leader}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin />
            工作地点
          </span>
          <span className="max-w-32 truncate font-medium">{organization.location}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">组织编码</span>
          <span className="font-medium">{organization.code}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">最后更新</span>
          <span className="font-medium">{organization.updatedAt.split(' ')[0]}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrganizationMembersCard({ organization }: { organization: OrganizationNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          组织负责人 <Badge variant="secondary">{organization.memberCount} 人</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{organization.leader.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{organization.leader}</p>
            <p className="text-xs text-muted-foreground">{organization.leaderRole}</p>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">编制使用</span>
          <span className="font-medium">
            {organization.memberCount} / {organization.headcount}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{
              width: `${Math.min(100, Math.round((organization.memberCount / organization.headcount) * 100))}%`
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>空缺岗位</span>
          <span>{organization.headcount - organization.memberCount} 个</span>
        </div>
        <AvatarGroup className="mt-1">
          {organization.members.slice(0, 4).map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger>
                <Avatar size="sm">
                  <AvatarFallback>{member.avatar}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{member.name}</TooltipContent>
            </Tooltip>
          ))}
          {organization.memberCount > 4 && (
            <AvatarGroupCount>+{organization.memberCount - 4}</AvatarGroupCount>
          )}
        </AvatarGroup>
      </CardContent>
    </Card>
  )
}

export function OrganizationTimelineCard() {
  const items = [
    { title: '新增岗位：高级产品经理', time: '今天 09:18', tone: 'bg-primary' },
    { title: '林清禾任命为产品一部负责人', time: '昨天 16:42', tone: 'bg-accent-foreground' },
    { title: '用户体验部组织编码更新', time: '2026-07-24', tone: 'bg-muted-foreground' }
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近变更</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.title} className="relative flex gap-3 text-sm last:after:hidden">
            <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.tone)} />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-medium leading-5">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarClock />
          仅展示最近 30 天记录
        </div>
      </CardContent>
    </Card>
  )
}
