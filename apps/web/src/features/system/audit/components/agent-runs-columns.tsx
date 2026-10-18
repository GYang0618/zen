'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import { formatCostMicros, formatDuration, formatTokens } from '@zen/shared'
import { Badge, Button } from '@zen/ui'
import { Eye } from 'lucide-react'

import { DataTableColumnHeader } from '@/components/data-table'

import { AuditActorCell } from './audit-actor-cell'

import type { AgentRunItem } from '../api'

const columnHelper = createColumnHelper<AgentRunItem>()

export function getAgentRunStatusConfig(status?: string | null) {
  const s = status?.toLowerCase()
  if (s === 'succeeded' || s === 'completed') {
    return {
      label: '成功',
      variant: 'outline' as const,
      className: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
    }
  }
  if (s === 'failed') {
    return {
      label: '失败',
      variant: 'destructive' as const,
      className: ''
    }
  }
  if (s === 'running') {
    return {
      label: '运行中',
      variant: 'secondary' as const,
      className: 'border-blue-500/30 text-blue-600 dark:text-blue-400'
    }
  }
  if (s === 'pending') {
    return {
      label: '排队中',
      variant: 'secondary' as const,
      className: 'text-muted-foreground'
    }
  }
  if (s === 'cancelled') {
    return {
      label: '已取消',
      variant: 'secondary' as const,
      className: 'text-muted-foreground'
    }
  }
  return {
    label: status || '未知',
    variant: 'secondary' as const,
    className: ''
  }
}

interface AgentRunsColumnsOptions {
  onViewDetail: (runId: string) => void
}

export function getAgentRunsColumns({ onViewDetail }: AgentRunsColumnsOptions) {
  return [
    columnHelper.accessor('createdAt', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="触发时间" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
          {row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '-'}
        </span>
      ),
      meta: { title: '触发时间' }
    }),

    columnHelper.accessor('userId', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="发起用户" />,
      enableSorting: false,
      cell: ({ row }) => {
        const run = row.original
        return (
          <AuditActorCell
            actor={run.user}
            actorType="user"
            identifier={run.userName || run.userId}
          />
        )
      },
      meta: { title: '发起用户' }
    }),

    columnHelper.accessor('title', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="任务标题 / 会话" />,
      enableSorting: false,
      cell: ({ row }) => {
        const run = row.original
        return (
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-foreground">{run.title || '智能助手会话'}</div>
            <div className="font-mono text-xs text-muted-foreground">ID: {run.id}</div>
          </div>
        )
      },
      meta: { title: '任务标题' }
    }),

    columnHelper.accessor('model', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="使用模型" />,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
          {row.original.model || '未记录'}
        </span>
      ),
      meta: { title: '使用模型' }
    }),

    columnHelper.accessor('totalTokens', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tokens" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground whitespace-nowrap">
          {row.original.usageReported === false
            ? '未采集'
            : formatTokens(row.original.totalTokens ?? 0)}
        </span>
      ),
      meta: { title: 'Tokens' }
    }),

    columnHelper.accessor('costMicros', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="预估费用" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-amber-600 dark:text-amber-400 whitespace-nowrap">
          {row.original.usageReported === false
            ? '未采集'
            : formatCostMicros(row.original.costMicros ?? 0)}
        </span>
      ),
      meta: { title: '预估费用' }
    }),

    columnHelper.accessor('durationMs', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="耗时" />,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
          {formatDuration(row.original.durationMs ?? 0)}
        </span>
      ),
      meta: { title: '耗时' }
    }),

    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      enableSorting: false,
      cell: ({ row }) => {
        const conf = getAgentRunStatusConfig(row.original.status)
        return (
          <Badge variant={conf.variant} className={`text-xs whitespace-nowrap ${conf.className}`}>
            {conf.label}
          </Badge>
        )
      },
      meta: { title: '状态' }
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">操作</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const run = row.original
        return (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              title="查看详情"
              onClick={() => onViewDetail(run.id)}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>详情</span>
            </Button>
          </div>
        )
      }
    })
  ]
}
