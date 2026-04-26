'use no memo'

import { Button, sleep, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { Mail, Trash2, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'

import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'

import type { Table } from '@tanstack/react-table'
import type { User } from '@zen/shared'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({ table }: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    toast.promise(sleep(2000), {
      loading: `${status === 'active' ? 'Activating' : 'Deactivating'} users...`,
      success: () => {
        table.resetRowSelection()
        return `${status === 'active' ? 'Activated' : 'Deactivated'} ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`
      },
      error: `Error ${status === 'active' ? 'activating' : 'deactivating'} users`
    })
    table.resetRowSelection()
  }

  const handleBulkInvite = () => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    toast.promise(sleep(2000), {
      loading: 'Inviting users...',
      success: () => {
        table.resetRowSelection()
        return `Invited ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`
      },
      error: 'Error inviting users'
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName="用户">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleBulkInvite}
              className="size-8"
              aria-label="邀请已选择的用户"
            >
              <Mail />
              <span className="sr-only">邀请已选择的用户</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>邀请已选择的用户</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleBulkStatusChange('active')}
              className="size-8"
              aria-label="激活已选择的用户"
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
              onClick={() => handleBulkStatusChange('inactive')}
              className="size-8"
              aria-label="禁用已选择的用户"
            >
              <UserX />
              <span className="sr-only">禁用已选择的用户</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>禁用已选择的用户</p>
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
