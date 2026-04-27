import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@zen/ui'
import { Power, Trash2, UserCheck, UserPen } from 'lucide-react'
import { toast } from 'sonner'

import { useUpdateUsersStatusMutation } from '../mutations'
import { useUsers } from '../users-provider'

import type { Row } from '@tanstack/react-table'
import type { User } from '@zen/shared'

type DataTableRowActionsProps = {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const { mutate: updateUsersStatus, isPending } = useUpdateUsersStatusMutation()
  const user = row.original
  const isSuspended = user.status === 'suspended'

  const handleStatusChange = () => {
    const nextStatus = isSuspended ? 'active' : 'suspended'
    updateUsersStatus(
      { ids: [user.id], status: nextStatus },
      {
        onSuccess: () => {
          toast.success(nextStatus === 'active' ? '用户已激活' : '用户已停用')
        }
      }
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('edit')
          }}
        >
          编辑
          <DropdownMenuShortcut>
            <UserPen size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleStatusChange} disabled={isPending}>
          {isSuspended ? '激活' : '停用'}
          <DropdownMenuShortcut>
            {isSuspended ? <UserCheck size={16} /> : <Power size={16} />}
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('delete')
          }}
          className="text-red-500!"
        >
          删除
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
