import { PermissionCode } from '@zen/shared'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@zen/ui'
import { Copy, MoreHorizontal, Pencil, ShieldCheck, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { useUpdateRoleMutation } from '@/features/system/roles/mutations'

import { useRoles } from '../roles-provider'

import type { Role } from '@zen/shared'

type RolesRowActionsProps = {
  role: Role
}

export function RolesRowActions({ role }: RolesRowActionsProps) {
  const { setOpen, setCurrentRow } = useRoles()
  const { mutate: updateRole } = useUpdateRoleMutation()

  const openDialog = (type: 'edit' | 'delete' | 'clone') => {
    setCurrentRow(role)
    setOpen(type)
  }

  const handleActivate = () => {
    if (role.effectiveStatus !== 'disabled') {
      toast.error('仅已冻结的角色可以激活')
      return
    }
    updateRole(
      { id: role.id, data: { status: 'active' } },
      {
        onSuccess: () => toast.success(`已激活角色「${role.name}」`)
      }
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
          <Can permission={PermissionCode.ROLE_UPDATE}>
            <DropdownMenuItem onClick={() => openDialog('edit')}>
              <Pencil /> 编辑信息
            </DropdownMenuItem>
          </Can>
          <Can permission={PermissionCode.ROLE_UPDATE}>
            {role.effectiveStatus === 'disabled' ? (
              <DropdownMenuItem onClick={handleActivate}>
                <ShieldCheck /> 激活角色
              </DropdownMenuItem>
            ) : null}
          </Can>
          <Can permission={PermissionCode.ROLE_CREATE}>
            {!role.isSystem ? (
              <DropdownMenuItem onClick={() => openDialog('clone')}>
                <Copy /> 克隆角色
              </DropdownMenuItem>
            ) : null}
          </Can>
        </DropdownMenuGroup>
        <Can permission={PermissionCode.ROLE_DELETE}>
          {!role.isSystem ? (
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
