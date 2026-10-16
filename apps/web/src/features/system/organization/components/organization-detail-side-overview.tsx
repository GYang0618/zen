import { formatFromNow } from '@zen/shared'
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
import { useMemo } from 'react'

import { useOrganizationPositions } from '../queries'
import { formatEffectiveDate } from '../utils'

import type { SharedOrganization } from '../type'

type OrganizationDetailSideOverviewProps = {
  organization: SharedOrganization
}

export function OrganizationDetailSideOverview({
  organization
}: OrganizationDetailSideOverviewProps) {
  const leader = organization.leader
  const { data: positions = [] } = useOrganizationPositions(organization.id)

  const staffingStats = useMemo(() => {
    const totalHeadcount = positions.reduce((sum, p) => sum + p.headcount, 0)
    const activeAssigned = positions.reduce((sum, p) => sum + p.activeCount, 0)
    const vacantPositions = positions.filter((p) => p.headcount > p.activeCount)
    const overstaffedPositions = positions.filter((p) => p.activeCount > p.headcount)

    const fillRate = totalHeadcount > 0 ? Math.round((activeAssigned / totalHeadcount) * 100) : 0

    return {
      totalHeadcount,
      activeAssigned,
      fillRate,
      vacantCount: Math.max(0, totalHeadcount - activeAssigned),
      overCount: Math.max(0, activeAssigned - totalHeadcount),
      vacantPositions,
      overstaffedPositions
    }
  }, [positions])

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
            <span className="font-medium">{formatFromNow(organization.updatedAt)}</span>
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>编制健康度看板</CardTitle>
            {staffingStats.totalHeadcount === 0 ? (
              <Badge variant="outline">未设编制</Badge>
            ) : staffingStats.overCount > 0 ? (
              <Badge variant="destructive" className="text-xs">
                超编 {staffingStats.overCount} 人
              </Badge>
            ) : staffingStats.vacantCount > 0 ? (
              <Badge variant="secondary" className="text-xs text-amber-600 dark:text-amber-400">
                缺编 {staffingStats.vacantCount} 人
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs text-emerald-600 dark:text-emerald-400">
                满编正常
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>在岗满编率</span>
              <span className="font-semibold text-foreground">{staffingStats.fillRate}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-300 ${
                  staffingStats.overCount > 0
                    ? 'bg-destructive'
                    : staffingStats.vacantCount > 0
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, staffingStats.fillRate)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-2.5 text-center">
            <div>
              <div className="text-xs text-muted-foreground">组织成员 / 在岗</div>
              <div className="text-lg font-bold text-foreground">
                {organization.memberCount}{' '}
                <span className="text-xs font-normal text-muted-foreground">人</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">核定总编制</div>
              <div className="text-lg font-bold text-foreground">
                {staffingStats.totalHeadcount}{' '}
                <span className="text-xs font-normal text-muted-foreground">人</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>设立岗位数</span>
            <span className="font-medium text-foreground">{organization.positionCount} 个岗位</span>
          </div>

          {staffingStats.vacantPositions.length > 0 ? (
            <div className="border-t pt-2 space-y-1.5">
              <div className="text-[11px] font-medium text-muted-foreground">空缺岗位速览：</div>
              <div className="flex flex-wrap gap-1.5">
                {staffingStats.vacantPositions.slice(0, 3).map((p) => (
                  <Badge key={p.id} variant="outline" className="text-[10px] py-0">
                    {p.name} (缺 {p.headcount - p.activeCount})
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </aside>
  )
}
