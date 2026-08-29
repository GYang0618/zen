'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import { formatFromNow, POSITION_MEMBER_PREVIEW_LIMIT } from '@zen/shared'
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
import { Building2 } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

import { DataTableColumnHeader } from '@/components/data-table'

import { getJobProfileIconColorClassName } from '../data'
import { formatJobProfileLevel, jobProfileStatusConfig } from '../utils'
import { PostsRowActions } from './posts-row-actions'

import type { ColumnDef } from '@tanstack/react-table'
import type { JobProfile, JobProfileStatus } from '@zen/shared'

const columnHelper = createColumnHelper<JobProfile>()

export const postsColumns = [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="岗位" />,
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              getJobProfileIconColorClassName(item.iconColor)
            )}
          >
            <DynamicIcon name={item.icon ?? 'briefcase-business'} aria-hidden />
          </div>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-foreground">{item.name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">{item.code}</span>
          </span>
        </div>
      )
    },
    meta: { title: '岗位' },
    enableHiding: false
  }),

  columnHelper.accessor('level', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="职级" />,
    cell: ({ getValue }) => (
      <span className="text-sm text-nowrap">{formatJobProfileLevel(getValue())}</span>
    ),
    meta: { title: '职级' }
  }),

  columnHelper.accessor('family', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="岗位族" />,
    cell: ({ getValue }) => {
      const family = getValue()
      return <span className="text-sm text-nowrap">{family || '—'}</span>
    },
    meta: { title: '岗位族' }
  }),

  columnHelper.accessor('status', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
    cell: ({ getValue }) => {
      const config = jobProfileStatusConfig[getValue()]
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) =>
      Array.isArray(value) && value.length > 0
        ? value.includes(row.getValue<JobProfileStatus>(id))
        : true,
    meta: { title: '状态' },
    enableColumnFilter: true,
    enableSorting: false
  }),

  columnHelper.accessor('organizationCount', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="关联组织" />,
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <Building2 className="size-3.5 text-muted-foreground" aria-hidden />
        {getValue()}
      </span>
    ),
    meta: { title: '关联组织' }
  }),

  columnHelper.accessor('totalHeadcount', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="编制 / 在岗" />,
    cell: ({ row }) => {
      const item = row.original
      const previewMembers = (item.memberPreview ?? []).slice(0, POSITION_MEMBER_PREVIEW_LIMIT)
      const overflowCount = Math.max(item.activeCount - previewMembers.length, 0)

      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-nowrap">
            {item.activeCount} / {item.totalHeadcount}
          </span>
          {previewMembers.length > 0 ? (
            <AvatarGroup>
              {previewMembers.map((member) => (
                <Avatar key={member.id} size="sm" title={member.name}>
                  {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
                  <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
              ))}
              {overflowCount > 0 ? (
                <AvatarGroupCount title={`另有 ${overflowCount} 人`}>
                  +{overflowCount}
                </AvatarGroupCount>
              ) : null}
            </AvatarGroup>
          ) : null}
        </div>
      )
    },
    meta: { title: '编制 / 在岗' }
  }),

  columnHelper.accessor('updatedAt', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="更新时间" />,
    cell: ({ getValue }) => (
      <span className="text-sm text-nowrap">{formatFromNow(getValue())}</span>
    ),
    meta: { title: '更新时间' }
  }),

  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <PostsRowActions item={row.original} />
  })
] as ColumnDef<JobProfile>[]
