'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import { Avatar, AvatarFallback, AvatarImage, Badge } from '@zen/ui'

import { DataTableColumnHeader } from '@/components/data-table'

import { organizationTypeLabels } from '../data/data'
import { OrganizationTypeIcon } from './organization-icon'

import type { ColumnDef } from '@tanstack/react-table'
import type { Organization } from '@zen/shared'

const columnHelper = createColumnHelper<Organization>()

export const organizationColumns: ColumnDef<Organization, unknown>[] = [
  columnHelper.accessor('name', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="组织名称" />,
    cell: ({ row }) => {
      const org = row.original
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted/40">
            <OrganizationTypeIcon type={org.type} className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-foreground text-sm">{org.name}</span>
            <span className="truncate font-mono text-muted-foreground text-xs">{org.code}</span>
          </div>
        </div>
      )
    },
    enableSorting: true
  }),

  columnHelper.accessor('type', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="组织类型" />,
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const label = organizationTypeLabels[type] ?? type
      return (
        <Badge variant="outline" className="text-xs">
          {label}
        </Badge>
      )
    },
    enableSorting: true
  }),

  columnHelper.accessor('leader', {
    header: '负责人',
    cell: ({ row }) => {
      const leader = row.original.leader
      if (!leader) {
        return <span className="text-muted-foreground text-xs">未指定</span>
      }
      return (
        <div className="flex items-center gap-2">
          <Avatar size="sm" className="size-6">
            {leader.avatar ? <AvatarImage src={leader.avatar} alt={leader.name} /> : null}
            <AvatarFallback className="text-[10px]">
              {leader.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm">{leader.name}</span>
        </div>
      )
    },
    enableSorting: false
  }),

  columnHelper.accessor('memberCount', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="成员数" />,
    cell: ({ row }) => {
      const count = row.getValue('memberCount') as number
      return <span className="font-mono text-sm tabular-nums">{count} 人</span>
    },
    enableSorting: true
  }),

  columnHelper.accessor('positionCount', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="岗位编制" />,
    cell: ({ row }) => {
      const count = row.getValue('positionCount') as number
      return <span className="font-mono text-sm tabular-nums">{count} 个</span>
    },
    enableSorting: true
  }),

  columnHelper.accessor('effectiveDate', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="生效日期" />,
    cell: ({ row }) => {
      const date = row.getValue('effectiveDate') as string
      return <span className="font-mono text-muted-foreground text-xs">{date}</span>
    },
    enableSorting: true
  })
] as ColumnDef<Organization, unknown>[]
