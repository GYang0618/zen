import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator
} from '@zen/ui'
import { CalendarSync, Fingerprint, Mail, Phone } from 'lucide-react'

import { formatEffectiveDate } from '../utils'

import type { SharedOrganization } from '../type'

type OrganizationDetailSideOverviewProps = {
  organization: SharedOrganization
}

export function OrganizationDetailSideOverview({
  organization
}: OrganizationDetailSideOverviewProps) {
  const leader = organization.leader
  const updatedAt = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(organization.updatedAt))

  return (
    <aside className="bg-muted/35 flex w-full shrink-0 flex-col gap-4 rounded-[28px] border border-dashed p-3 @5xl/content:w-90 @5xl/content:self-start">
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
            <span className="font-medium">{organization.code}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarSync className="size-4" />
              生效日期
            </span>
            <span className="font-medium">{formatEffectiveDate(organization.effectiveDate)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarSync className="size-4" />
              最后更新
            </span>
            <span className="font-medium">{updatedAt}</span>
          </div>

          <Separator />

          {leader ? (
            <div>
              <Item className="mb-5 p-0">
                <ItemMedia>
                  <Avatar className="size-14">
                    <AvatarImage src={leader.avatar ?? undefined} />
                    <AvatarFallback>{leader.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-lg leading-6">
                    {leader.name}
                    <Badge variant="secondary" className="bg-green-300/50">
                      负责人
                    </Badge>
                  </ItemTitle>
                  <ItemDescription className="leading-5">{leader.title || '—'}</ItemDescription>
                </ItemContent>
              </Item>
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-md border px-3 py-1">
                  <Mail className="size-4" />
                  <span>{leader.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border px-3 py-1">
                  <Phone className="size-4" />
                  <span>{leader.phone || '—'}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂未指定负责人</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>成员 / 岗位</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">成员数</span>
            <span className="font-medium">{organization.memberCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">岗位数</span>
            <span className="font-medium">{organization.positionCount}</span>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
