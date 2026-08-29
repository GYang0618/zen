'use no memo'

import { PermissionCode } from '@zen/shared'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { Ban, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { BulkActionsToolbar } from '@/components/data-table'

import { useUpdateRolesStatusMutation } from '../mutations'
import { getDeletableRoles, getRolesForStatusChange } from '../utils'
import { RolesMultiDeleteDialog } from './roles-multi-delete-dialog'

import type { Role, RoleStatus } from '@zen/shared'

type RolesBulkActionsProps = {
  selectedItems: Role[]
  onClearSelection: () => void
  isSelecting?: boolean
}

export function RolesBulkActions({
  selectedItems,
  onClearSelection,
  isSelecting = false
}: RolesBulkActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateRolesStatusMutation()
  const hasSelection = selectedItems.length > 0
  const activateTargets = getRolesForStatusChange(selectedItems, 'active')
  const freezeTargets = getRolesForStatusChange(selectedItems, 'disabled')
  const deletableItems = getDeletableRoles(selectedItems)

  const handleBulkStatusChange = (status: RoleStatus) => {
    const targets = status === 'active' ? activateTargets : freezeTargets
    if (targets.length === 0) return

    const actionText = status === 'active' ? '激活' : '冻结'
    updateStatus(
      { ids: targets.map((role) => role.id), status },
      {
        onSuccess: (result) => {
          if (result.failedCount === 0) {
            toast.success(`已${actionText} ${result.successCount} 个角色`)
          } else {
            toast.warning(
              `已${actionText} ${result.successCount} 个角色，${result.failedCount} 个失败`
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
        entityName="角色"
        visible={isSelecting}
        onClearSelection={onClearSelection}
      >
        <Can permission={PermissionCode.ROLE_UPDATE}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleBulkStatusChange('active')}
                className="size-8"
                aria-label="激活已选择的角色"
                disabled={!hasSelection || activateTargets.length === 0 || isUpdatingStatus}
              >
                <ShieldCheck />
                <span className="sr-only">激活已选择的角色</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>激活已选择的角色</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleBulkStatusChange('disabled')}
                className="size-8"
                aria-label="冻结已选择的角色"
                disabled={!hasSelection || freezeTargets.length === 0 || isUpdatingStatus}
              >
                <Ban />
                <span className="sr-only">冻结已选择的角色</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>冻结已选择的角色</p>
            </TooltipContent>
          </Tooltip>
        </Can>

        <Can permission={PermissionCode.ROLE_DELETE}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="size-8"
                aria-label="删除已选择的角色"
                disabled={!hasSelection || deletableItems.length === 0}
              >
                <Trash2 />
                <span className="sr-only">删除已选择的角色</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!hasSelection
                  ? '请先选择角色'
                  : deletableItems.length === 0
                    ? '系统角色或仍有成员的角色无法删除'
                    : '删除已选择的角色'}
              </p>
            </TooltipContent>
          </Tooltip>
        </Can>
      </BulkActionsToolbar>

      <RolesMultiDeleteDialog
        items={deletableItems}
        skippedCount={selectedItems.length - deletableItems.length}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onDeleted={onClearSelection}
      />
    </>
  )
}
