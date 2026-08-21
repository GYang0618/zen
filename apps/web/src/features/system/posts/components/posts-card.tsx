import { formatFromNow, POSITION_MEMBER_PREVIEW_LIMIT } from '@zen/shared'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardHeader,
  cn,
  Field,
  FieldLabel,
  Separator
} from '@zen/ui'
import { Building2, CalendarDays } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import { getJobProfileIconColorClassName } from '../data'
import { formatJobProfileLevel, jobProfileStatusConfig } from '../utils'
import { PostsRowActions } from './posts-row-actions'

import type { JobProfile } from '@zen/shared'

type PostsCardProps = {
  item: JobProfile
}

export function PostsCard({ item }: PostsCardProps) {
  const previewMembers = (item.memberPreview ?? []).slice(0, POSITION_MEMBER_PREVIEW_LIMIT)
  const overflowCount = Math.max(item.activeCount - previewMembers.length, 0)
  const status = jobProfileStatusConfig[item.status]

  return (
    <Card className="gap-3">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                getJobProfileIconColorClassName(item.iconColor)
              )}
            >
              <DynamicIcon
                name={item.icon ?? 'briefcase-business'}
                className="size-4"
                aria-hidden
              />
            </div>
            <span className="truncate text-xs">{item.code}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            <PostsRowActions item={item} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <h2 className="text-base font-semibold">{item.name}</h2>
        <p className="mt-1 text-muted-foreground">{formatJobProfileLevel(item.level)}</p>
        {item.family ? (
          <p className="mt-1 text-xs text-muted-foreground">岗位族 · {item.family}</p>
        ) : null}
        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {item.description || '暂无描述'}
        </p>
        <div className="mt-2 flex min-h-8 items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground" title="最后更新时间">
            <CalendarDays className="size-4" aria-hidden />
            {formatFromNow(item.updatedAt)}
          </span>
          {previewMembers.length > 0 ? (
            <AvatarGroup>
              {previewMembers.map((member) => (
                <Avatar key={member.id} size="sm" title={member.name}>
                  {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
                  <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
              ))}
              {overflowCount > 0 ? (
                <AvatarGroupCount title={`另有 ${overflowCount} 人`}>
                  +{overflowCount}
                </AvatarGroupCount>
              ) : null}
            </AvatarGroup>
          ) : null}
        </div>
        <Separator className="mt-4 mb-3" />
        <Field>
          <FieldLabel>
            <span className="flex items-center gap-1.5 text-sm">
              <Building2 className="size-3.5 text-muted-foreground" aria-hidden />
              已关联 {item.organizationCount} 个组织
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              总编制 {item.totalHeadcount}
            </span>
          </FieldLabel>
        </Field>
      </CardContent>
    </Card>
  )
}
