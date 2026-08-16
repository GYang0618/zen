import { PermissionCode, POSITION_MEMBER_PREVIEW_LIMIT } from '@zen/shared'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Separator,
  Skeleton
} from '@zen/ui'
import { Ban, Building2, CalendarDays, MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { useMemo, useState } from 'react'

import { Can } from '@/components/auth/can'
import { FacetedFilter } from '@/components/faceted-filter'

import { getJobProfileIconColorClassName } from '../data'
import { usePosts } from '../posts-provider'
import { useJobProfilesQuery } from '../queries'
import { formatJobProfileLevel, formatJobProfileStatus, JOB_PROFILE_STATUS_OPTIONS } from '../utils'

import type { JobProfile, JobProfileStatus } from '@zen/shared'

function formatUpdatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function PostsList() {
  const { setOpen, setCurrentRow } = usePosts()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobProfileStatus[]>([])

  const query = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      keyword: keyword.trim() || undefined,
      status: statusFilter[0]
    }),
    [keyword, statusFilter]
  )

  const { data, isLoading, isError } = useJobProfilesQuery(query)
  const profiles = data?.items ?? []

  return (
    <>
      <section className="flex flex-wrap gap-4">
        <InputGroup className="max-w-sm min-w-56 flex-1">
          <InputGroupInput
            placeholder="搜索岗位名称、编码或岗位族"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <FacetedFilter
          options={JOB_PROFILE_STATUS_OPTIONS.map((item) => ({
            label: item.label,
            value: item.value
          }))}
          value={statusFilter}
          onValueChange={(values) => setStatusFilter(values as JobProfileStatus[])}
        />
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? <p className="text-sm text-destructive">岗位列表加载失败</p> : null}

      {!isLoading && !isError ? (
        <section className="@container">
          {profiles.length ? (
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
              {profiles.map((item) => (
                <JobProfileCard
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setCurrentRow(item)
                    setOpen('edit')
                  }}
                  onDisable={() => {
                    setCurrentRow(item)
                    setOpen('disable')
                  }}
                  onDelete={() => {
                    setCurrentRow(item)
                    setOpen('delete')
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">暂无岗位目录</p>
          )}
        </section>
      ) : null}
    </>
  )
}

type JobProfileCardProps = {
  item: JobProfile
  onEdit: () => void
  onDisable: () => void
  onDelete: () => void
}

function JobProfileCard({ item, onEdit, onDisable, onDelete }: JobProfileCardProps) {
  const previewMembers = (item.memberPreview ?? []).slice(0, POSITION_MEMBER_PREVIEW_LIMIT)
  const overflowCount = Math.max(item.activeCount - previewMembers.length, 0)

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
            <Badge
              variant="outline"
              className={cn(
                item.status === 'active'
                  ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : 'border-muted-foreground/30'
              )}
            >
              {formatJobProfileStatus(item.status)}
            </Badge>

            <Can permission={PermissionCode.POST_MANAGE}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`打开${item.name}的操作`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={onEdit}>
                      <Pencil />
                      编辑
                    </DropdownMenuItem>
                    {item.status === 'active' ? (
                      <DropdownMenuItem variant="destructive" onSelect={onDisable}>
                        <Ban />
                        停用
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                      <Trash2 />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Can>
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
            {formatUpdatedAt(item.updatedAt)}
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
