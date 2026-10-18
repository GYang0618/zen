'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import { Badge, Button } from '@zen/ui'
import { AlertTriangle, CheckCircle2, Eye, ShieldAlert } from 'lucide-react'

import { DataTableColumnHeader } from '@/components/data-table'

import { AuditActorCell } from './audit-actor-cell'

import type { AuditLogItem } from '../api'

const columnHelper = createColumnHelper<AuditLogItem>()

export function getOperationAuditColumns(
  onViewDetail: (log: AuditLogItem) => void,
  activeLogId?: string | null
) {
  return [
    columnHelper.accessor('createdAt', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="时间" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
      meta: { title: '时间' }
    }),

    columnHelper.accessor('actorType', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="操作主体" />,
      enableSorting: false,
      cell: ({ row }) => {
        const log = row.original
        return (
          <AuditActorCell
            actor={log.actor}
            actorType={log.actorType}
            actorName={log.actorName}
            actorDisplay={log.actorDisplay}
            agentRunId={log.agentRunId}
            agentToolName={log.agentToolName}
          />
        )
      },
      meta: { title: '操作主体' }
    }),

    columnHelper.accessor('title', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="操作行为" />,
      enableSorting: false,
      cell: ({ row }) => {
        const log = row.original
        return (
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-foreground">
              {log.title || log.actionLabel}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {log.description || log.action}
            </div>
          </div>
        )
      },
      meta: { title: '操作行为' }
    }),

    columnHelper.accessor('resource', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="关联目标" />,
      enableSorting: false,
      cell: ({ row }) => {
        const log = row.original
        const text = log.resourceName || log.resource
        return (
          <span
            className={`truncate text-sm ${text ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {text || '-'}
          </span>
        )
      },
      meta: { title: '关联目标' }
    }),

    columnHelper.accessor('result', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      enableSorting: false,
      cell: ({ row }) => {
        const log = row.original
        if (log.result === 'SUCCESS') {
          return (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
            >
              <CheckCircle2 className="h-3 w-3" />
              成功
            </Badge>
          )
        }
        if (log.result === 'DENIED') {
          return (
            <Badge variant="destructive" className="gap-1 text-xs whitespace-nowrap">
              <ShieldAlert className="h-3 w-3" />
              拒绝
            </Badge>
          )
        }
        return (
          <Badge variant="destructive" className="gap-1 text-xs whitespace-nowrap">
            <AlertTriangle className="h-3 w-3" />
            失败
          </Badge>
        )
      },
      meta: { title: '状态' }
    }),

    columnHelper.accessor('endpoint', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="IP / 端点" />,
      enableSorting: false,
      cell: ({ row }) => {
        const log = row.original
        return (
          <div className="space-y-0.5">
            <div className="truncate font-mono text-sm text-foreground">{log.ip || '-'}</div>
            {log.endpoint && (
              <div className="truncate font-mono text-xs text-muted-foreground">{log.endpoint}</div>
            )}
          </div>
        )
      },
      meta: { title: 'IP / 端点' }
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">操作</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const isActive = activeLogId === row.original.id
        return (
          <div className="text-right">
            <Button
              type="button"
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onViewDetail(row.original)}
              aria-label="查看详情"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="sr-only">详情</span>
            </Button>
          </div>
        )
      }
    })
  ]
}
