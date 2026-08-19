import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useNavigate } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@zen/ui'
import { Eye, KeyRound, LockOpen, LogOut, Power, Trash2, UserCheck, UserPen } from 'lucide-react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'

import { useUnlockUserMutation, useUpdateUsersStatusMutation } from '../mutations'
import { useUsers } from '../users-provider'

import type { Row } from '@tanstack/react-table'
import type { User } from '@zen/shared'

type DataTableRowActionsProps = {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const navigate = useNavigate()
  const { setOpen, setCurrentRow } = useUsers()
  const { mutate: updateUsersStatus, isPending } = useUpdateUsersStatusMutation()
  const { mutate: unlockUser, isPending: isUnlocking } = useUnlockUserMutation()
  const user = row.original
  const isSuspended = user.status === 'suspended'
  const isLocked = user.isLocked === true

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
      <DropdownMenuContent align="end" className="w-45">
        <DropdownMenuItem
          onClick={() => {
            void navigate({ to: '/system/users/$userId', params: { userId: user.id } })
          }}
        >
          查看
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <Can permission={PermissionCode.USER_UPDATE}>
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
        </Can>
        <DropdownMenuSeparator />
        <Can permission={PermissionCode.USER_STATUS}>
          <DropdownMenuItem onClick={handleStatusChange} disabled={isPending}>
            {isSuspended ? '激活' : '停用'}
            <DropdownMenuShortcut>
              {isSuspended ? <UserCheck size={16} /> : <Power size={16} />}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </Can>
        <Can permission={PermissionCode.USER_UPDATE}>
          {isLocked ? (
            <DropdownMenuItem
              disabled={isUnlocking}
              onClick={() => {
                unlockUser(user.id, {
                  onSuccess: () => toast.success('账号已解锁')
                })
              }}
            >
              解锁
              <DropdownMenuShortcut>
                <LockOpen size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('reset-password')
            }}
          >
            重置密码
            <DropdownMenuShortcut>
              <KeyRound size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('revoke-sessions')
            }}
          >
            强制下线
            <DropdownMenuShortcut>
              <LogOut size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </Can>
        <Can permission={PermissionCode.USER_DELETE}>
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
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
