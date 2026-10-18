'use no memo'

import { createColumnHelper } from '@tanstack/react-table'
import { Badge } from '@zen/ui'
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldAlert
} from 'lucide-react'

import { DataTableColumnHeader } from '@/components/data-table'

import { parseUserAgent } from '../utils/user-agent'
import { AuditActorCell } from './audit-actor-cell'

import type { LoginEventItem } from '../api'

const columnHelper = createColumnHelper<LoginEventItem>()

function getEventBadge(event: string) {
  if (event.includes('logout')) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground whitespace-nowrap">
        <LogOut className="h-3 w-3" />
        账号登出
      </Badge>
    )
  }
  if (event.includes('refresh')) {
    return (
      <Badge variant="secondary" className="gap-1 whitespace-nowrap">
        <RefreshCw className="h-3 w-3" />
        Token 刷新
      </Badge>
    )
  }
  if (event.includes('locked')) {
    return (
      <Badge variant="destructive" className="gap-1 whitespace-nowrap">
        <ShieldAlert className="h-3 w-3" />
        账号锁定
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-foreground whitespace-nowrap">
      <LogIn className="h-3 w-3" />
      用户登录
    </Badge>
  )
}

export const loginEventColumns = [
  columnHelper.accessor('createdAt', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="发生时间" />,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
        {row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '-'}
      </span>
    ),
    meta: { title: '发生时间' }
  }),

  columnHelper.accessor('identifier', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="登录账号 / 标识" />,
    enableSorting: false,
    cell: ({ row }) => {
      const item = row.original
      return <AuditActorCell actor={item.user} identifier={item.identifier} actorType="user" />
    },
    meta: { title: '登录账号' }
  }),

  columnHelper.accessor('event', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="事件类型" />,
    enableSorting: false,
    cell: ({ row }) => getEventBadge(row.original.event),
    meta: { title: '事件类型' }
  }),

  columnHelper.accessor('success', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
    enableSorting: false,
    cell: ({ row }) => {
      const isSuccess = row.original.success
      return isSuccess ? (
        <Badge
          variant="outline"
          className="gap-1 border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
        >
          <CheckCircle2 className="h-3 w-3" />
          成功
        </Badge>
      ) : (
        <Badge variant="destructive" className="gap-1 text-xs whitespace-nowrap">
          <AlertTriangle className="h-3 w-3" />
          失败
        </Badge>
      )
    },
    meta: { title: '状态' }
  }),

  columnHelper.accessor('ip', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="IP 地址" />,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 font-mono text-sm text-foreground whitespace-nowrap">
        <Globe className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <span>{row.original.ip || '-'}</span>
      </div>
    ),
    meta: { title: 'IP 地址' }
  }),

  columnHelper.accessor('userAgent', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="客户端环境" />,
    enableSorting: false,
    cell: ({ row }) => {
      const parsed = parseUserAgent(row.original.userAgent)
      return (
        <span
          className="max-w-44 truncate font-medium text-sm text-foreground block cursor-help"
          title={parsed.raw || undefined}
        >
          {parsed.label}
        </span>
      )
    },
    meta: { title: '客户端环境' }
  }),

  columnHelper.accessor('reason', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="备注 / 失败原因" />,
    enableSorting: false,
    cell: ({ row }) => {
      const reason = row.original.reason
      return (
        <span
          className={`truncate max-w-48 block text-sm ${
            reason ? 'text-destructive font-medium' : 'text-muted-foreground'
          }`}
        >
          {reason || '-'}
        </span>
      )
    },
    meta: { title: '失败原因' }
  })
]
