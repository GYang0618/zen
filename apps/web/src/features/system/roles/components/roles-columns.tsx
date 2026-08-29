'use no memo'

import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { formatFromNow, ROLE_MEMBER_PREVIEW_LIMIT } from '@zen/shared'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  Checkbox,
  cn
} from '@zen/ui'
import { ShieldCheck } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import { DataTableColumnHeader } from '@/components/data-table'

import { dataScopeConfig, getRoleIconColorClassName, roleEffectiveStatusConfig } from '../data/data'
import { RolesRowActions } from './roles-row-actions'

import type { ColumnDef } from '@tanstack/react-table'
import type { Role, RoleDataScope, RoleEffectiveStatus, RoleIcon } from '@zen/shared'

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
    header: ({ column }) => <DataTableColumnHeader column={column} title="角色" />,
    cell: ({ row }) => {
      const role = row.original
      return (
        <Link to="/system/roles/$id" params={{ id: role.id }} className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              getRoleIconColorClassName(role.iconColor)
            )}
          >
            <DynamicIcon name={(role.icon as RoleIcon | null) ?? 'shield'} />
          </div>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-foreground">{role.name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">{role.code}</span>
          </span>
        </Link>
      )
    },
    meta: { title: '角色' },
    enableHiding: false
  }),

  columnHelper.accessor('effectiveStatus', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
    cell: ({ getValue }) => {
      const status = getValue()
      const config = roleEffectiveStatusConfig[status]
      return (
        <Badge variant="outline" className={cn('capitalize', config.className)}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) =>
      Array.isArray(value) && value.length > 0
        ? value.includes(row.getValue<RoleEffectiveStatus>(id))
        : true,
    meta: { title: '状态' },
    enableColumnFilter: true,
    enableSorting: false
  }),

  columnHelper.accessor('dataScope', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="数据范围" />,
    cell: ({ getValue }) => {
      const scope = getValue()
      return <span className="text-sm text-nowrap">{dataScopeConfig[scope].label}</span>
    },
    filterFn: (row, id, value) =>
      Array.isArray(value) && value.length > 0
        ? value.includes(row.getValue<RoleDataScope>(id))
        : true,
    meta: { title: '数据范围' },
    enableColumnFilter: true,
    enableSorting: false
  }),

  columnHelper.accessor('expiresAt', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="有效期" />,
    cell: ({ getValue }) => {
      const expiresAt = getValue()
      return (
        <span className="text-sm text-nowrap">
          {expiresAt ? formatFromNow(expiresAt) : '长期有效'}
        </span>
      )
    },
    meta: { title: '有效期' }
  }),

  columnHelper.accessor('permissionCount', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="权限" />,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <ShieldCheck className="size-3.5 text-muted-foreground" />
        {getValue()} 项
      </span>
    ),
    meta: { title: '权限' }
  }),

  columnHelper.accessor('memberCount', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="成员" />,
    cell: ({ row }) => {
      const role = row.original
      const previewMembers = role.memberPreview.slice(0, ROLE_MEMBER_PREVIEW_LIMIT)
      const overflowCount = role.memberCount - previewMembers.length

      if (role.memberCount === 0) {
        return <span className="text-sm text-muted-foreground">—</span>
      }

      return (
        <div className="flex items-center gap-2">
          <AvatarGroup>
            {previewMembers.map((member) => (
              <Avatar key={member.id} size="sm">
                {member.avatar ? <AvatarImage src={member.avatar} alt="" /> : null}
                <AvatarFallback>{(member.nickname ?? '?').slice(0, 1)}</AvatarFallback>
              </Avatar>
            ))}
            {overflowCount > 0 ? <AvatarGroupCount>+{overflowCount}</AvatarGroupCount> : null}
          </AvatarGroup>
          <span className="text-xs text-muted-foreground">{role.memberCount}</span>
        </div>
      )
    },
    meta: { title: '成员' }
  }),

  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <RolesRowActions role={row.original} />
  })
] as ColumnDef<Role>[]
