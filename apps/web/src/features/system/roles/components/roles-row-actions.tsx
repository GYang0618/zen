import { PermissionCode } from '@zen/shared'
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@zen/ui'
import { Ban, CheckSquare, Copy, MoreHorizontal, Pencil, ShieldCheck, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { useUpdateRoleMutation } from '@/features/system/roles/mutations'

import { useRoles } from '../roles-provider'
import { canChangeRoleStatus, isProtectedRole } from '../utils'

import type { Role } from '@zen/shared'
import type { ListSelectionActionProps } from '@/hooks'

type RolesRowActionsProps = ListSelectionActionProps & {
  role: Role
}

export function RolesRowActions({
  role,
  isSelecting = false,
  selected = false,
  onEnterSelecting,
  onSelectedChange
}: RolesRowActionsProps) {
  const { setOpen, setCurrentRow } = useRoles()
  const { mutate: updateRole, isPending } = useUpdateRoleMutation()
  const canToggleStatus = canChangeRoleStatus(role)
  const isFrozen = role.status === 'disabled'

  const openDialog = (type: 'edit' | 'delete' | 'clone') => {
    setCurrentRow(role)
    setOpen(type)
  }

  const handleStatusChange = () => {
    if (!canToggleStatus) {
      toast.error('系统角色状态不可修改')
      return
    }
    const nextStatus = isFrozen ? 'active' : 'disabled'
    updateRole(
      { id: role.id, data: { status: nextStatus } },
      {
        onSuccess: () =>
          toast.success(
            nextStatus === 'active' ? `已激活角色「${role.name}」` : `已冻结角色「${role.name}」`
          )
      }
    )
  }

  if (isSelecting) {
    return (
      <span className="inline-flex size-8 items-center justify-center">
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectedChange?.(!!value)}
          aria-label={`选择${role.name}`}
        />
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`${role.name} 更多操作`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4}>
        <DropdownMenuGroup>
          {onEnterSelecting ? (
            <DropdownMenuItem onSelect={onEnterSelecting}>
              <CheckSquare /> 选择
            </DropdownMenuItem>
          ) : null}
          <Can permission={PermissionCode.ROLE_UPDATE}>
            <DropdownMenuItem onClick={() => openDialog('edit')}>
              <Pencil /> 编辑信息
            </DropdownMenuItem>
          </Can>
          <Can permission={PermissionCode.ROLE_UPDATE}>
            {canToggleStatus ? (
              <DropdownMenuItem onClick={handleStatusChange} disabled={isPending}>
                {isFrozen ? <ShieldCheck /> : <Ban />}
                {isFrozen ? '激活角色' : '冻结角色'}
              </DropdownMenuItem>
            ) : null}
          </Can>
          <Can permission={PermissionCode.ROLE_CREATE}>
            {!isProtectedRole(role) ? (
              <DropdownMenuItem onClick={() => openDialog('clone')}>
                <Copy /> 克隆角色
              </DropdownMenuItem>
            ) : null}
          </Can>
        </DropdownMenuGroup>
        <Can permission={PermissionCode.ROLE_DELETE}>
          {!isProtectedRole(role) ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => openDialog('delete')}>
                <Trash /> 删除角色
              </DropdownMenuItem>
            </>
          ) : null}
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
