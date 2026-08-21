import { formatFromNow, PermissionCode, POSITION_MEMBER_PREVIEW_LIMIT } from '@zen/shared'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Progress,
  Separator
} from '@zen/ui'
import {
  BriefcaseBusiness,
  CalendarDays,
  MoreHorizontal,
  PanelsTopLeft,
  Plus,
  Search,
  Unlink
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { useOrganizationPositions, useRemoveOrganizationPosition } from '../queries'
import { formatPositionLevel } from '../utils'
import { OrganizationCreatePositionDialog } from './organization-create-position-dialog'

import type { Position } from '../type'

type OrganizationPositionsProps = {
  organizationId: string
}

function matchesPosition(position: Position, keyword: string): boolean {
  const query = keyword.trim().toLowerCase()
  if (!query) return true

  return [position.name, position.code, position.description, position.level]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query)
}

export function OrganizationPositions({ organizationId }: OrganizationPositionsProps) {
  const { data: positions = [], isLoading } = useOrganizationPositions(organizationId)
  const [keyword, setKeyword] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [unlinkTarget, setUnlinkTarget] = useState<Position | null>(null)

  const filteredPositions = useMemo(
    () => positions.filter((position) => matchesPosition(position, keyword)),
    [keyword, positions]
  )

  return (
    <div className="@container flex flex-col gap-4">
      <section className="flex flex-wrap items-center gap-3">
        <InputGroup className="max-w-sm min-w-56 flex-1">
          <InputGroupInput
            placeholder="搜索岗位名称、编码或描述"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Can permission={PermissionCode.POST_MANAGE}>
          <Button type="button" onClick={() => setCreateDialogOpen(true)}>
            <Plus />
            关联岗位
          </Button>
        </Can>
      </section>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">加载岗位…</p>
      ) : filteredPositions.length ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {filteredPositions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              onUnlink={() => setUnlinkTarget(position)}
            />
          ))}
        </div>
      ) : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BriefcaseBusiness />
            </EmptyMedia>
            <EmptyTitle>{positions.length ? '未找到匹配岗位' : '暂无岗位编制'}</EmptyTitle>
            <EmptyDescription>
              {positions.length
                ? '尝试调整搜索关键词，或关联新的岗位编制'
                : '你可点击下方按钮从岗位目录关联编制'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Can permission={PermissionCode.POST_MANAGE}>
              <Button type="button" onClick={() => setCreateDialogOpen(true)}>
                <Plus />
                关联岗位
              </Button>
            </Can>
          </EmptyContent>
        </Empty>
      )}

      <OrganizationCreatePositionDialog
        open={createDialogOpen}
        organizationId={organizationId}
        positions={positions}
        onOpenChange={setCreateDialogOpen}
      />

      <OrganizationUnlinkPositionDialog
        organizationId={organizationId}
        position={unlinkTarget}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null)
        }}
      />
    </div>
  )
}

type PositionCardProps = {
  position: Position
  onUnlink: () => void
}

function PositionCard({ position, onUnlink }: PositionCardProps) {
  const vacancy = Math.max(position.headcount - position.activeCount, 0)
  const fillRate =
    position.headcount > 0 ? Math.round((position.activeCount / position.headcount) * 100) : 0
  const previewMembers = (position.memberPreview ?? []).slice(0, POSITION_MEMBER_PREVIEW_LIMIT)
  const overflowCount = Math.max(position.activeCount - previewMembers.length, 0)

  return (
    <Card className="gap-3">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted-foreground/10">
              <PanelsTopLeft className="size-4" />
            </div>
            <span className="truncate text-xs">{position.code}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant="outline">{vacancy > 0 ? '有空缺' : '已满编'}</Badge>
            <Can permission={PermissionCode.POST_MANAGE}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`打开${position.name}的操作`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuGroup>
                    <DropdownMenuItem variant="destructive" onSelect={onUnlink}>
                      <Unlink />
                      取消关联
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Can>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h2 className="text-base font-semibold">{position.name}</h2>
        <p className="mt-1 text-muted-foreground">{formatPositionLevel(position.level)}</p>
        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {position.description || '暂无描述'}
        </p>
        <div className="mt-2 flex min-h-8 items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground" title="最后更新时间">
            <CalendarDays className="size-4" aria-hidden />
            {formatFromNow(position.updatedAt)}
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
            <span className="text-sm">{fillRate}%</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {position.activeCount}/{position.headcount} 在岗 · {vacancy} 空缺
            </span>
          </FieldLabel>
          <Progress value={fillRate} />
        </Field>
      </CardContent>
    </Card>
  )
}

type OrganizationUnlinkPositionDialogProps = {
  organizationId: string
  position: Position | null
  onOpenChange: (open: boolean) => void
}

function OrganizationUnlinkPositionDialog({
  organizationId,
  position,
  onOpenChange
}: OrganizationUnlinkPositionDialogProps) {
  const removePosition = useRemoveOrganizationPosition(organizationId)
  const hasActiveMembers = (position?.activeCount ?? 0) > 0

  return (
    <ConfirmDialog
      open={Boolean(position)}
      onOpenChange={onOpenChange}
      title="取消岗位关联？"
      desc={
        position ? (
          hasActiveMembers ? (
            <>
              「{position.name}」当前仍有 {position.activeCount}{' '}
              人在岗，请先调整成员岗位后再取消关联。
            </>
          ) : (
            <>确认取消「{position.name}」与当前组织的编制关联？此操作不会删除岗位目录本身。</>
          )
        ) : (
          '确认取消该岗位关联？'
        )
      }
      cancelBtnText="取消"
      confirmText="确认取消关联"
      destructive
      disabled={!position || hasActiveMembers}
      isLoading={removePosition.isPending}
      handleConfirm={() => {
        if (!position || hasActiveMembers) return
        removePosition.mutate(position.id, {
          onSuccess: () => onOpenChange(false)
        })
      }}
    />
  )
}
