'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import { Badge, Checkbox, cn } from '@zen/ui'

import { LongText } from '@/components'
import { DataTableColumnHeader } from '@/components/data-table'
import { getConfig } from '@/lib/config-utils'

import { roleConfig, statusConfig } from '../data/data'
import { DataTableRowActions } from './data-table-row-actions'

import type { User } from '../data/schema'

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
    header: ({ column }) => <DataTableColumnHeader column={column} title="用户名" />,
    cell: (info) => <LongText className="max-w-36 ps-3">{info.getValue()}</LongText>,
    meta: {
      title: '用户名',
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      )
    },
    enableHiding: false
  }),

  columnHelper.accessor('email', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="邮箱" />,
    cell: (info) => <div className="w-fit ps-2 text-nowrap">{info.getValue()}</div>,
    meta: {
      title: '邮箱'
    }
  }),

  columnHelper.accessor('phoneNumber', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="手机号" />,
    cell: (info) => <div>{info.getValue()}</div>,
    enableSorting: false,
    meta: {
      title: '手机号'
    }
  }),

  columnHelper.accessor('status', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
    cell: (info) => {
      const status = info.getValue()
      const { label, color } = getConfig(statusConfig, status)
      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className={cn('capitalize', color)}>
            {label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      title: '状态'
    }
  }),

  columnHelper.accessor('role', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="角色" />,
    cell: (info) => {
      const role = info.getValue()
      const { label, icon: Icon } = getConfig(roleConfig, role)

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
    meta: {
      title: '角色'
    },
    enableSorting: false,
    enableHiding: false
  }),

  columnHelper.display({
    id: 'actions',
    cell: DataTableRowActions
  })
]
