'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import { Badge } from '@zen/ui'

import { DataTableColumnHeader } from '@/components/data-table'

import { AuditActorCell } from './audit-actor-cell'

import type { ApiAccessLogItem } from '../api'

const columnHelper = createColumnHelper<ApiAccessLogItem>()

function getMethodBadge(method: string) {
  const m = method.toUpperCase()
  if (m === 'GET') {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap"
      >
        GET
      </Badge>
    )
  }
  if (m === 'POST') {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 font-mono text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
      >
        POST
      </Badge>
    )
  }
  if (m === 'PUT' || m === 'PATCH') {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 font-mono text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap"
      >
        {m}
      </Badge>
    )
  }
  if (m === 'DELETE') {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 font-mono text-xs text-destructive whitespace-nowrap"
      >
        DELETE
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="font-mono text-xs whitespace-nowrap">
      {m}
    </Badge>
  )
}

export function getAccessLogColumns(_onNavigateAgentRun?: (runId: string) => void) {
  return [
    columnHelper.accessor('createdAt', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="请求时间" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
          })}
        </span>
      ),
      meta: { title: '请求时间' }
    }),

    columnHelper.accessor('method', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="方法" />,
      enableSorting: false,
      cell: ({ row }) => getMethodBadge(row.original.method),
      meta: { title: '方法' }
    }),

    columnHelper.accessor('route', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="接口路由 & 功能" />,
      enableSorting: false,
      cell: ({ row }) => {
        const log = row.original
        return (
          <div className="space-y-0.5">
            <div className="font-mono text-sm font-medium text-foreground">{log.route}</div>
            <div className="text-xs text-muted-foreground">{log.title}</div>
          </div>
        )
      },
      meta: { title: '接口路由' }
    }),

    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态码" />,
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.original.status
        const isError = status >= 400
        return isError ? (
          <Badge variant="destructive" className="font-mono text-xs whitespace-nowrap">
            {status}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-emerald-500/30 font-mono text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
          >
            {status}
          </Badge>
        )
      },
      meta: { title: '状态码' }
    }),

    columnHelper.accessor('latencyMs', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="响应耗时" />,
      cell: ({ row }) => {
        const latency = row.original.latencyMs
        const latencyClass =
          latency >= 3000
            ? 'font-bold text-red-600 dark:text-red-400'
            : latency >= 1000
              ? 'font-bold text-yellow-600 dark:text-yellow-400'
              : latency >= 300
                ? 'font-medium text-orange-600 dark:text-orange-400'
                : 'text-emerald-600 dark:text-emerald-400'
        return (
          <span className={`font-mono text-sm whitespace-nowrap ${latencyClass}`}>
            {latency} ms
          </span>
        )
      },
      meta: { title: '耗时' }
    }),

    columnHelper.accessor('callerType', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="调用主体" />,
      enableSorting: false,
      cell: ({ row }) => {
        const log = row.original
        return (
          <AuditActorCell
            actor={log.user}
            actorType={
              log.callerType === 'AGENT'
                ? 'agent'
                : log.callerType === 'ANONYMOUS'
                  ? 'anonymous'
                  : 'user'
            }
            agentRunId={log.agentRunId}
            agentToolName={log.agentToolName}
            identifier={log.userId}
          />
        )
      },
      meta: { title: '调用主体' }
    }),

    columnHelper.accessor('ip', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="客户端 IP" />,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-foreground whitespace-nowrap">
          {row.original.ip || '-'}
        </span>
      ),
      meta: { title: '客户端 IP' }
    })
  ]
}
