'use no memo'

import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { Trash2, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'

import { useUpdateUsersStatusMutation } from '../mutations'
import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'

import type { Table } from '@tanstack/react-table'
import type { User, UserActivationStatus } from '@zen/shared'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({ table }: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { mutate: updateUsersStatus, isPending: isUpdatingStatus } = useUpdateUsersStatusMutation()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: UserActivationStatus) => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    const ids = selectedUsers.map((user) => user.id)
    updateUsersStatus(
      { ids, status },
      {
        onSuccess: () => {
          const actionText = status === 'active' ? '激活' : '停用'
          toast.success(`已${actionText} ${selectedUsers.length} 个用户`)
          table.resetRowSelection()
        }
      }
    )
  }

  const hasSelection = selectedRows.length > 0

  return (
    <>
      <BulkActionsToolbar table={table} entityName="用户">
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
            <p>删除已选择的用户</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <UsersMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}
