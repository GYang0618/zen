'use no memo'

import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { Unlink } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { BulkActionsToolbar } from '@/components/data-table'

import { useBatchUnlinkOrganizationPositions } from '../queries'

import type { Position } from '../type'

type OrganizationPositionsBulkActionsProps = {
  organizationId: string
  selectedPositions: Position[]
  isSelecting?: boolean
  onClearSelection: () => void
}

function positionPreview(positions: Position[]): string {
  const names = positions.map((position) => position.name)
  if (names.length <= 3) return names.join('、')
  return `${names.slice(0, 3).join('、')} 等 ${names.length} 个岗位`
}

export function OrganizationPositionsBulkActions({
  organizationId,
  selectedPositions,
  isSelecting = false,
  onClearSelection
}: OrganizationPositionsBulkActionsProps) {
  const [unlinkOpen, setUnlinkOpen] = useState(false)
  const hasSelection = selectedPositions.length > 0
  const occupied = selectedPositions.filter((position) => position.activeCount > 0)

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedPositions.length}
        entityName="岗位"
        visible={isSelecting}
        onClearSelection={onClearSelection}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setUnlinkOpen(true)}
                className="size-8"
                aria-label="取消已选择岗位的关联"
                disabled={!hasSelection}
              />
            }
          >
            <Unlink />
            <span className="sr-only">取消已选择岗位的关联</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasSelection ? '取消已选择岗位的关联' : '请先选择岗位'}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <OrganizationBatchUnlinkDialog
        organizationId={organizationId}
        positions={selectedPositions}
        occupied={occupied}
        open={unlinkOpen}
        onOpenChange={setUnlinkOpen}
        onUnlinked={onClearSelection}
      />
    </>
  )
}

function OrganizationBatchUnlinkDialog({
  organizationId,
  positions,
  occupied,
  open,
  onOpenChange,
  onUnlinked
}: {
  organizationId: string
  positions: Position[]
  occupied: Position[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnlinked: () => void
}) {
  const unlinkPositions = useBatchUnlinkOrganizationPositions(organizationId)
  const blocked = occupied.length > 0

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="批量取消岗位关联？"
      desc={
        blocked ? (
          <>
            「{positionPreview(occupied)}
            」当前仍有在岗人员，请先调整成员岗位后再取消关联。
          </>
        ) : (
          <>
            确认取消「{positionPreview(positions)}
            」与当前组织的编制关联？此操作不会删除岗位目录本身。
          </>
        )
      }
      cancelBtnText="取消"
      confirmText="确认取消关联"
      destructive
      disabled={positions.length === 0 || blocked}
      isLoading={unlinkPositions.isPending}
      handleConfirm={() => {
        if (positions.length === 0 || blocked) return
        unlinkPositions.mutate(
          { positionIds: positions.map((position) => position.id) },
          {
            onSuccess: () => {
              onOpenChange(false)
              onUnlinked()
            }
          }
        )
      }}
    />
  )
}
