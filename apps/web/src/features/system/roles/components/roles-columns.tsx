'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import { Badge, Checkbox, cn } from '@zen/ui'

import { LongText } from '@/components'
import { DataTableColumnHeader } from '@/components/data-table'
import { getConfig } from '@/lib/config-utils'

import { dataScopeConfig, roleStatusConfig } from '../data/data'
import { DataTableRowActions } from './data-table-row-actions'

import type { ColumnDef } from '@tanstack/react-table'
import type { Role } from '@zen/shared'

const columnHelper = createColumnHelper<Role>()

export const rolesColumns = [
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
  columnHelper.accessor('name', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="角色名称" />,
    cell: (info) => <LongText className="max-w-48 ps-3">{info.getValue()}</LongText>,
    meta: {
      title: '角色名称',
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      )
    },
    enableHiding: false
  }),
  columnHelper.accessor('code', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="角色编码" />,
    cell: (info) => <code className="text-xs font-medium">{info.getValue()}</code>,
    meta: {
      title: '角色编码'
    }
  }),
  columnHelper.accessor('status', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
    cell: (info) => {
      const status = info.getValue()
      const { label, color } = getConfig(roleStatusConfig, status)
      return (
        <Badge variant="outline" className={cn('capitalize', color)}>
          {label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    meta: {
      title: '状态'
    }
  }),
  columnHelper.accessor('dataScope', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="数据范围" />,
    cell: (info) => {
      const scope = info.getValue()
      const { label, icon: Icon } = getConfig(dataScopeConfig, scope)
      return (
        <div className="flex items-center gap-x-2">
          <Icon size={16} className="text-muted-foreground" />
          <span className="text-sm">{label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    meta: {
      title: '数据范围'
    },
    enableSorting: false
  }),
  columnHelper.accessor('memberCount', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="成员数量" />,
    cell: (info) => <div>{info.getValue()}</div>,
    meta: {
      title: '成员数量'
    }
  }),
  columnHelper.accessor('description', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="描述" />,
    cell: (info) => <LongText className="max-w-64">{info.getValue() ?? '—'}</LongText>,
    enableSorting: false,
    meta: {
      title: '描述'
    }
  }),
  columnHelper.display({
    id: 'actions',
    cell: DataTableRowActions
  })
] as ColumnDef<Role>[]
