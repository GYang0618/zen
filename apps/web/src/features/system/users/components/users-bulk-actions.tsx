'use no memo'

import { PermissionCode } from '@zen/shared'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { Trash2, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { BulkActionsToolbar } from '@/components/data-table'

import { useUpdateUsersStatusMutation } from '../mutations'
import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'

import type { User } from '@zen/shared'

type UsersBulkActionsProps = {
  selectedItems: User[]
  onClearSelection: () => void
  isSelecting?: boolean
}

export function UsersBulkActions({
  selectedItems,
  onClearSelection,
  isSelecting = false
}: UsersBulkActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { mutate: updateUsersStatus, isPending: isUpdatingStatus } = useUpdateUsersStatusMutation()
  const hasSelection = selectedItems.length > 0

  const handleBulkStatusChange = (status: Extract<User['status'], 'active' | 'suspended'>) => {
    if (!hasSelection) return
    const ids = selectedItems.map((user) => user.id)
    updateUsersStatus(
      { ids, status },
      {
        onSuccess: () => {
          const actionText = status === 'active' ? '激活' : '停用'
          toast.success(`已${actionText} ${selectedItems.length} 个用户`)
          onClearSelection()
        }
      }
    )
  }

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedItems.length}
        entityName="用户"
        visible={isSelecting}
        onClearSelection={onClearSelection}
      >
        <Can permission={PermissionCode.USER_STATUS}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleBulkStatusChange('active')}
                className="size-8"
                aria-label="激活已选择的用户"
                disabled={!hasSelection || isUpdatingStatus}
              >
                <UserCheck />
                <span className="sr-only">激活已选择的用户</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>激活已选择的用户</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleBulkStatusChange('suspended')}
                className="size-8"
                aria-label="停用已选择的用户"
                disabled={!hasSelection || isUpdatingStatus}
              >
                <UserX />
                <span className="sr-only">停用已选择的用户</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>停用已选择的用户</p>
            </TooltipContent>
          </Tooltip>
        </Can>

        <Can permission={PermissionCode.USER_DELETE}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="size-8"
                aria-label="删除已选择的用户"
                disabled={!hasSelection}
              >
                <Trash2 />
                <span className="sr-only">删除已选择的用户</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hasSelection ? '删除已选择的用户' : '请先选择用户'}</p>
            </TooltipContent>
          </Tooltip>
        </Can>
      </BulkActionsToolbar>

      <UsersMultiDeleteDialog
        users={selectedItems}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onDeleted={onClearSelection}
      />
    </>
  )
}
