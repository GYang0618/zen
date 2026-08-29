'use no memo'

import { PermissionCode } from '@zen/shared'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { Ban, Power, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { BulkActionsToolbar } from '@/components/data-table'

import { useUpdateJobProfilesStatusMutation } from '../queries'
import { getDeletableJobProfiles, getJobProfilesForStatusChange } from '../utils'
import { PostsMultiDeleteDialog } from './posts-multi-delete-dialog'

import type { JobProfile, JobProfileStatus } from '@zen/shared'

type PostsBulkActionsProps = {
  selectedItems: JobProfile[]
  onClearSelection: () => void
  isSelecting?: boolean
}

export function PostsBulkActions({
  selectedItems,
  onClearSelection,
  isSelecting = false
}: PostsBulkActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateJobProfilesStatusMutation()
  const hasSelection = selectedItems.length > 0
  const enableTargets = getJobProfilesForStatusChange(selectedItems, 'active')
  const disableTargets = getJobProfilesForStatusChange(selectedItems, 'disabled')
  const deletableItems = getDeletableJobProfiles(selectedItems)

  const handleBulkStatusChange = (status: JobProfileStatus) => {
    const targets = status === 'active' ? enableTargets : disableTargets
    if (targets.length === 0) return

    const actionText = status === 'active' ? '启用' : '停用'
    updateStatus(
      { ids: targets.map((item) => item.id), status },
      {
        onSuccess: (result) => {
          if (result.failedCount === 0) {
            toast.success(`已${actionText} ${result.successCount} 个岗位`)
          } else {
            toast.warning(
              `已${actionText} ${result.successCount} 个岗位，${result.failedCount} 个失败`
            )
          }
          onClearSelection()
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : `${actionText}失败`)
        }
      }
    )
  }

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedItems.length}
        entityName="岗位"
        visible={isSelecting}
        onClearSelection={onClearSelection}
      >
        <Can permission={PermissionCode.POST_MANAGE}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleBulkStatusChange('active')}
                className="size-8"
                aria-label="启用已选择的岗位"
                disabled={!hasSelection || enableTargets.length === 0 || isUpdatingStatus}
              >
                <Power />
                <span className="sr-only">启用已选择的岗位</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>启用已选择的岗位</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleBulkStatusChange('disabled')}
                className="size-8"
                aria-label="停用已选择的岗位"
                disabled={!hasSelection || disableTargets.length === 0 || isUpdatingStatus}
              >
                <Ban />
                <span className="sr-only">停用已选择的岗位</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>停用已选择的岗位</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="size-8"
                aria-label="删除已选择的岗位"
                disabled={!hasSelection || deletableItems.length === 0}
              >
                <Trash2 />
                <span className="sr-only">删除已选择的岗位</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!hasSelection
                  ? '请先选择岗位'
                  : deletableItems.length === 0
                    ? '所选岗位均已关联组织，无法删除'
                    : '删除已选择的岗位'}
              </p>
            </TooltipContent>
          </Tooltip>
        </Can>
      </BulkActionsToolbar>

      <PostsMultiDeleteDialog
        items={deletableItems}
        skippedCount={selectedItems.length - deletableItems.length}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onDeleted={onClearSelection}
      />
    </>
  )
}
