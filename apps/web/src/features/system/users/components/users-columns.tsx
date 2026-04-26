'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage, Badge, Checkbox, cn } from '@zen/ui'
import { Mail, Phone } from 'lucide-react'

import { DataTableColumnHeader } from '@/components/data-table'
import { getConfig } from '@/lib/config-utils'

import { getRoleDisplay, statusConfig } from '../data/data'
import { DataTableRowActions } from './data-table-row-actions'

import type { ColumnDef } from '@tanstack/react-table'
import type { User } from '@zen/shared'

const columnHelper = createColumnHelper<User>()

export const usersColumns = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="全选"
        className="translate-y-0.5"
      />
    ),
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]')
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="选择行"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false
  }),

  columnHelper.accessor('username', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="用户" />,
    cell: ({ row }) => {
      const { avatar, username, nickname } = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatar ?? ''} alt={username} />
            <AvatarFallback>{(nickname ?? username).charAt(0).toUpperCase()}</AvatarFallback>
            <AvatarBadge className="bg-green-600 dark:bg-green-800" />
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{username}</span>
            <span className="text-xs text-muted-foreground">{nickname}</span>
          </div>
        </div>
      )
    },
    meta: { title: '用户' },
    enableHiding: false
  }),

  columnHelper.accessor('email', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="联系方式" />,
    cell: ({ row }) => {
      const { email, phoneNumber } = row.original
      return (
        <div className="w-fit ps-2 text-nowrap flex flex-col gap-0.5">
          <div className="flex items-center gap-x-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{email}</span>
          </div>
          {phoneNumber && (
            <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{phoneNumber ?? '未绑定'}</span>
            </div>
          )}
        </div>
      )
    },
    meta: { title: '联系方式' }
  }),

  columnHelper.accessor('status', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
    cell: (info) => {
      const status = info.getValue()
      const { label, color } = getConfig(statusConfig, status)
      return (
        <Badge variant="outline" className={cn('capitalize', color)}>
          {label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: { title: '状态' },
    enableSorting: false
  }),

  columnHelper.accessor('role', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="角色" />,
    cell: (info) => {
      const role = info.getValue()
      const { label, icon: Icon } = getRoleDisplay(role)

      return (
        <div className="flex items-center gap-x-2">
          {Icon && <Icon size={16} className="text-muted-foreground" />}
          <span className="text-sm capitalize">{label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: { title: '角色' },
    enableSorting: false,
    enableHiding: false
  }),

  columnHelper.accessor('jobTitle', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="岗位" />,
    cell: (info) => <div className="ps-2 text-nowrap">{info.getValue() ?? '未设置'}</div>,
    meta: { title: '岗位' }
  }),
  columnHelper.accessor('createdAt', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
    cell: (info) => (
      <div className="w-fit ps-2 text-nowrap">{new Date(info.getValue()).toLocaleDateString()}</div>
    ),
    meta: { title: '创建时间' }
  }),

  columnHelper.display({
    id: 'actions',
    cell: DataTableRowActions
  })
] as ColumnDef<User>[]
