'use no memo'

import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { Badge, Checkbox, cn } from '@zen/ui'
import { Mail, Phone } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import { DataTableColumnHeader } from '@/components/data-table'
import { getRoleIconColorClassName } from '@/features/system/roles/data/data'

import { statusConfig } from '../data/data'
import {
  formatFromNow,
  getOrganizationLabel,
  getPrimaryMembership,
  getUserDisplayName
} from '../utils'
import { DataTableRowActions } from './data-table-row-actions'
import { UserAvatar } from './user-avatar'

import type { ColumnDef } from '@tanstack/react-table'
import type { RoleIcon, User } from '@zen/shared'

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
      const user = row.original
      const name = getUserDisplayName(user)
      return (
        <Link
          to="/system/users/$userId"
          params={{ userId: user.id }}
          className="flex items-center gap-3"
        >
          <UserAvatar user={user} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-foreground">{name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              @{user.username}
            </span>
          </span>
        </Link>
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
        <div className="flex w-fit flex-col gap-0.5 ps-2 text-nowrap">
          <div className="flex items-center gap-x-2 text-sm">
            <Mail className="size-3.5 text-muted-foreground" />
            <span>{email}</span>
          </div>
          {phoneNumber ? (
            <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              <span>{phoneNumber}</span>
            </div>
          ) : null}
        </div>
      )
    },
    meta: { title: '联系方式' }
  }),

  columnHelper.display({
    id: 'organization',
    header: ({ column }) => <DataTableColumnHeader column={column} title="组织 / 岗位" />,
    cell: ({ row }) => {
      const primary = getPrimaryMembership(row.original)
      return <span className="text-sm text-nowrap">{getOrganizationLabel(primary)}</span>
    },
    meta: { title: '组织 / 岗位' },
    enableSorting: false
  }),

  columnHelper.accessor((row) => (row.roles ?? []).map((role) => role.code), {
    id: 'roles',
    header: ({ column }) => <DataTableColumnHeader column={column} title="角色" />,
    cell: ({ row }) => {
      const roles = row.original.roles ?? []
      if (roles.length === 0) {
        return <span className="text-sm text-muted-foreground">—</span>
      }
      return (
        <div className="flex flex-wrap gap-1">
          {roles.slice(0, 3).map((role) => (
            <Badge key={role.id} variant="outline" className="gap-1 font-normal">
              <span
                className={cn(
                  'inline-flex size-4 items-center justify-center rounded-sm',
                  getRoleIconColorClassName(
                    role.iconColor as Parameters<typeof getRoleIconColorClassName>[0]
                  )
                )}
              >
                <DynamicIcon name={(role.icon as RoleIcon | null) ?? 'shield'} className="size-3" />
              </span>
              {role.name}
            </Badge>
          ))}
          {roles.length > 3 ? <Badge variant="secondary">+{roles.length - 3}</Badge> : null}
        </div>
      )
    },
    filterFn: (row, _id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      return (row.original.roles ?? []).some((role) => value.includes(role.code))
    },
    getUniqueValues: (row) => (row.roles ?? []).map((role) => role.code),
    meta: { title: '角色' },
    enableColumnFilter: true,
    enableSorting: false,
    enableHiding: false
  }),

  columnHelper.accessor('status', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
    cell: ({ row }) => {
      const { status, isLocked } = row.original
      const config = statusConfig[status]
      return (
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="outline" className={cn('capitalize', config.className)}>
            {config.label}
          </Badge>
          {isLocked ? (
            <Badge variant="destructive" className="font-normal">
              已锁定
            </Badge>
          ) : null}
        </div>
      )
    },
    filterFn: (row, id, value) =>
      Array.isArray(value) && value.length > 0 ? value.includes(row.getValue(id)) : true,
    meta: { title: '状态' },
    enableSorting: false
  }),

  columnHelper.accessor('lastActiveAt', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="最后活跃时间" />,
    cell: (info) => <div className="w-fit ps-2 text-nowrap">{formatFromNow(info.getValue())}</div>,
    meta: { title: '最后活跃时间' }
  }),

  columnHelper.display({
    id: 'actions',
    cell: DataTableRowActions
  })
] as ColumnDef<User>[]
