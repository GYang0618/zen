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
import { Shield, ShieldAlert } from 'lucide-react'

import { useRoles } from '../roles-provider'

import type { Row } from '@tanstack/react-table'
import type { Role } from '@zen/shared'

type DataTableRowActionsProps = {
  row: Row<Role>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useRoles()
  const role = row.original
  const isSuperAdmin = role.code === 'super_admin'

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          disabled={isSuperAdmin}
          onClick={() => {
            setCurrentRow(role)
            setOpen('edit')
          }}
        >
          编辑
          <DropdownMenuShortcut>
            <Shield size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={role.isSystem}
          onClick={() => {
            setCurrentRow(role)
            setOpen('delete')
          }}
          className="text-red-500!"
        >
          删除
          <DropdownMenuShortcut>
            <ShieldAlert size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
