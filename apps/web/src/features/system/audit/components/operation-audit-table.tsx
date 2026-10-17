import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@zen/ui'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  ShieldAlert,
  Terminal,
  User
} from 'lucide-react'
import { useState } from 'react'

import { AuditDetailSheet } from '@/components/audit/audit-detail-sheet'

import { useAuditList } from '../queries'

import type { AuditLogItem, AuditQuery } from '../api'

interface OperationAuditTableProps {
  initialAgentRunId?: string
  onNavigateAgentRun?: (runId: string) => void
}

export function OperationAuditTable({
  initialAgentRunId,
  onNavigateAgentRun
}: OperationAuditTableProps) {
  const [params, setParams] = useState<AuditQuery>({
    page: 1,
    pageSize: 15,
    agentRunId: initialAgentRunId
  })
  const [keywordInput, setKeywordInput] = useState('')
  const [activeLog, setActiveLog] = useState<AuditLogItem | null>(null)

  const { data, isLoading, isFetching, refetch } = useAuditList(params)
  const items = data?.items ?? []
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  const handleSearch = () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      keyword: keywordInput.trim() || undefined
    }))
  }

  const handleActorTypeChange = (val: string | null) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      actorType: !val || val === 'ALL' ? undefined : (val as AuditQuery['actorType'])
    }))
  }

  const handleResultChange = (val: string | null) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      result: !val || val === 'ALL' ? undefined : (val as AuditQuery['result'])
    }))
  }

  return (
    <div className="space-y-4">
      {/* 搜索与过滤工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索操作人 / 描述 / 资源..."
              className="pl-8 text-sm"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleSearch}>
            查询
          </Button>

          <Select value={params.actorType ?? 'ALL'} onValueChange={handleActorTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="操作主体" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部主体</SelectItem>
              <SelectItem value="user">自然人</SelectItem>
              <SelectItem value="agent">AI Agent</SelectItem>
              <SelectItem value="system">系统内核</SelectItem>
              <SelectItem value="anonymous">匿名</SelectItem>
            </SelectContent>
          </Select>

          <Select value={params.result ?? 'ALL'} onValueChange={handleResultChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="执行结果" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部结果</SelectItem>
              <SelectItem value="SUCCESS">执行成功</SelectItem>
              <SelectItem value="FAILURE">执行失败</SelectItem>
              <SelectItem value="DENIED">权限拒绝</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {params.agentRunId && (
            <Badge
              variant="outline"
              className="gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400"
            >
              <Bot className="h-3 w-3" />
              已过滤 Agent: {params.agentRunId.slice(0, 8)}...
              <button
                type="button"
                className="ml-1 hover:text-foreground"
                onClick={() => setParams((p) => ({ ...p, agentRunId: undefined }))}
              >
                ×
              </button>
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">时间</TableHead>
              <TableHead className="w-48">操作主体</TableHead>
              <TableHead>操作行为</TableHead>
              <TableHead className="w-40">关联目标</TableHead>
              <TableHead className="w-28">状态</TableHead>
              <TableHead className="w-36">IP / 端点</TableHead>
              <TableHead className="w-20 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Spinner />
                    <span>正在加载审计日志...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  暂无匹配的审计记录
                </TableCell>
              </TableRow>
            ) : (
              items.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.actorType === 'agent' ? (
                        <Bot className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                      ) : log.actorType === 'system' ? (
                        <Terminal className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-xs font-medium text-foreground">
                        {log.actorDisplay}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">
                        {log.title || log.actionLabel}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {log.description || log.action}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="truncate text-xs text-muted-foreground">
                      {log.resourceName || log.resource || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.result === 'SUCCESS' ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        成功
                      </Badge>
                    ) : log.result === 'DENIED' ? (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <ShieldAlert className="h-3 w-3" />
                        拒绝
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        失败
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    <div className="truncate">{log.ip || '-'}</div>
                    <div className="truncate opacity-75">{log.endpoint || ''}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setActiveLog(log)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="sr-only">详情</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控制 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>共 {total} 条审计记录</div>
        <div className="flex items-center gap-2">
          <span>
            第 {params.page ?? 1} / {totalPages} 页
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={(params.page ?? 1) <= 1}
            onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={(params.page ?? 1) >= totalPages}
            onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AuditDetailSheet
        log={activeLog}
        open={Boolean(activeLog)}
        onOpenChange={(open) => !open && setActiveLog(null)}
        onNavigateAgentRun={onNavigateAgentRun}
      />
    </div>
  )
}
