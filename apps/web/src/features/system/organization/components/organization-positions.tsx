import { PermissionCode } from '@zen/shared'
import {
  Button,
  cn,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@zen/ui'
import { BriefcaseBusiness, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { selectItemsById, useListSelection } from '@/hooks'

import { useOrganizationPositions, useRemoveOrganizationPosition } from '../queries'
import { OrganizationCreatePositionDialog } from './organization-create-position-dialog'
import { OrganizationPositionCard } from './organization-position-card'
import { OrganizationPositionRolesDialog } from './organization-position-roles-dialog'
import { OrganizationPositionsBulkActions } from './organization-positions-bulk-actions'

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
  const selection = useListSelection()
  const [keyword, setKeyword] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [unlinkTarget, setUnlinkTarget] = useState<Position | null>(null)
  const [rolesTarget, setRolesTarget] = useState<Position | null>(null)

  const filteredPositions = useMemo(
    () => positions.filter((position) => matchesPosition(position, keyword)),
    [keyword, positions]
  )
  const selectedPositions = useMemo(
    () => selectItemsById(positions, selection.selectedIds),
    [positions, selection.selectedIds]
  )

  return (
    <div className={cn('@container flex flex-col gap-4', 'max-sm:has-[div[role="toolbar"]]:mb-16')}>
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
            <OrganizationPositionCard
              key={position.id}
              position={position}
              isSelecting={selection.isSelecting}
              selected={selection.isSelected(position.id)}
              onSelectedChange={(nextSelected) => selection.setSelected(position.id, nextSelected)}
              onUnlink={() => setUnlinkTarget(position)}
              onEditRoles={() => setRolesTarget(position)}
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

      <OrganizationPositionRolesDialog
        open={Boolean(rolesTarget)}
        onOpenChange={(open) => {
          if (!open) setRolesTarget(null)
        }}
        organizationId={organizationId}
        position={rolesTarget}
      />

      <OrganizationPositionsBulkActions
        organizationId={organizationId}
        selectedPositions={selectedPositions}
        isSelecting={selection.isSelecting}
        onClearSelection={selection.clear}
      />
    </div>
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
