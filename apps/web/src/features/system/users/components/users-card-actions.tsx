import { useNavigate } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import {
  Button,
  Checkbox,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@zen/ui'
import {
  CheckSquare,
  Eye,
  KeyRound,
  LockOpen,
  LogOut,
  MoreHorizontal,
  Power,
  Trash2,
  UserCheck,
  UserPen
} from 'lucide-react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'

import { useUnlockUserMutation, useUpdateUsersStatusMutation } from '../mutations'
import { useUsers } from '../users-provider'

import type { User } from '@zen/shared'
import type { ListSelectionActionProps } from '@/hooks'

export function UsersCardActions({
  user,
  className,
  isSelecting = false,
  selected = false,
  onEnterSelecting,
  onSelectedChange
}: ListSelectionActionProps & { user: User; className?: string }) {
  const navigate = useNavigate()
  const { setOpen, setCurrentRow } = useUsers()
  const { mutate: updateUsersStatus, isPending } = useUpdateUsersStatusMutation()
  const { mutate: unlockUser, isPending: isUnlocking } = useUnlockUserMutation()
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

  if (isSelecting) {
    return (
      <span className="inline-flex size-8 items-center justify-center">
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectedChange?.(!!value)}
          aria-label={`选择${user.username}`}
        />
      </span>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`打开${user.username}的操作菜单`}
          className={cn(
            'opacity-0 transition-opacity duration-200',
            'group-hover/card:opacity-100',
            'focus-visible:opacity-100',
            'data-popup-open:opacity-100',
            '[@media(hover:none)]:opacity-100',
            className
          )}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-45">
        {onEnterSelecting ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onEnterSelecting}>
                选择
                <DropdownMenuShortcut>
                  <CheckSquare />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem
          onClick={() => {
            void navigate({ to: '/system/users/$userId', params: { userId: user.id } })
          }}
        >
          查看
          <DropdownMenuShortcut>
            <Eye />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <Can permission={PermissionCode.USER_UPDATE}>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user)
              setOpen('edit')
            }}
          >
            编辑
            <DropdownMenuShortcut>
              <UserPen />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </Can>
        <DropdownMenuSeparator />
        <Can permission={PermissionCode.USER_STATUS}>
          <DropdownMenuItem onClick={handleStatusChange} disabled={isPending}>
            {isSuspended ? '激活' : '停用'}
            <DropdownMenuShortcut>{isSuspended ? <UserCheck /> : <Power />}</DropdownMenuShortcut>
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
                <LockOpen />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user)
              setOpen('reset-password')
            }}
          >
            重置密码
            <DropdownMenuShortcut>
              <KeyRound />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user)
              setOpen('revoke-sessions')
            }}
          >
            强制下线
            <DropdownMenuShortcut>
              <LogOut />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </Can>
        <Can permission={PermissionCode.USER_DELETE}>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(user)
              setOpen('delete')
            }}
            className="text-red-500!"
          >
            删除
            <DropdownMenuShortcut>
              <Trash2 />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
