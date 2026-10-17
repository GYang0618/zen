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
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
  User
} from 'lucide-react'
import { useState } from 'react'

import { useAccessLogs } from '../queries'

import type { ApiAccessLogQuery } from '../api'

function getMethodBadge(method: string) {
  const m = method.toUpperCase()
  if (m === 'GET') {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 font-mono text-[11px] text-blue-600 dark:text-blue-400"
      >
        GET
      </Badge>
    )
  }
  if (m === 'POST') {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 font-mono text-[11px] text-emerald-600 dark:text-emerald-400"
      >
        POST
      </Badge>
    )
  }
  if (m === 'PUT' || m === 'PATCH') {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 font-mono text-[11px] text-amber-600 dark:text-amber-400"
      >
        {m}
      </Badge>
    )
  }
  if (m === 'DELETE') {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 font-mono text-[11px] text-destructive"
      >
        DELETE
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="font-mono text-[11px]">
      {m}
    </Badge>
  )
}

interface AccessLogTableProps {
  onNavigateAgentRun?: (runId: string) => void
}

export function AccessLogTable({ onNavigateAgentRun }: AccessLogTableProps) {
  const [params, setParams] = useState<ApiAccessLogQuery>({
    page: 1,
    pageSize: 15
  })
  const [routeInput, setRouteInput] = useState('')

  const { data, isLoading, isFetching, refetch } = useAccessLogs(params)
  const items = data?.items ?? []
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  const handleSearch = () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      route: routeInput.trim() || undefined
    }))
  }

  const handleMethodChange = (val: string | null) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      method: !val || val === 'ALL' ? undefined : val
    }))
  }

  const toggleOnlyErrors = () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      onlyErrors: !prev.onlyErrors
    }))
  }

  const toggleSlowRequests = () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      minLatencyMs: prev.minLatencyMs ? undefined : 1000
    }))
  }

  return (
    <div className="space-y-4">
      {/* 搜索与快捷过滤条 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="过滤路由路径..."
              className="pl-8 text-sm"
              value={routeInput}
              onChange={(e) => setRouteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleSearch}>
            过滤
          </Button>

          <Select value={params.method ?? 'ALL'} onValueChange={handleMethodChange}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="HTTP 方法" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部方法</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={params.onlyErrors ? 'destructive' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={toggleOnlyErrors}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            仅异常 (4xx/5xx)
          </Button>

          <Button
            type="button"
            variant={params.minLatencyMs ? 'secondary' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={toggleSlowRequests}
          >
            <Clock className="h-3.5 w-3.5" />
            慢请求 (&gt;1s)
          </Button>
        </div>

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

      {/* 数据表格 */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">请求时间</TableHead>
              <TableHead className="w-20">方法</TableHead>
              <TableHead>接口路由 & 功能描述</TableHead>
              <TableHead className="w-24">状态码</TableHead>
              <TableHead className="w-24">响应耗时</TableHead>
              <TableHead className="w-32">调用主体</TableHead>
              <TableHead className="w-36">客户端 IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Spinner />
                    <span>正在检索 API 访问日志...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  暂无匹配的访问日志
                </TableCell>
              </TableRow>
            ) : (
              items.map((log) => {
                const isError = log.status >= 400
                const isSlow = log.latencyMs >= 1000

                return (
                  <TableRow key={log.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{getMethodBadge(log.method)}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-mono text-xs font-medium text-foreground">
                          {log.route}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{log.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isError ? (
                        <Badge variant="destructive" className="font-mono text-xs">
                          {log.status}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 font-mono text-xs text-emerald-600 dark:text-emerald-400"
                        >
                          {log.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-mono text-xs ${isSlow ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
                      >
                        {log.latencyMs} ms
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {log.callerType === 'AGENT' ? (
                          <div className="flex items-center gap-1">
                            <Bot className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            {log.agentRunId && onNavigateAgentRun ? (
                              <button
                                type="button"
                                className="font-mono text-xs text-purple-600 underline-offset-4 hover:underline dark:text-purple-400"
                                onClick={() => onNavigateAgentRun(log.agentRunId!)}
                              >
                                Agent
                              </button>
                            ) : (
                              <span className="text-xs text-purple-600 dark:text-purple-400">
                                Agent
                              </span>
                            )}
                          </div>
                        ) : log.callerType === 'ANONYMOUS' ? (
                          <span className="text-xs text-muted-foreground">匿名访客</span>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-foreground">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{log.userId ? '已认证用户' : '用户'}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ip || '-'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控制 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>共 {total} 条访问日志（写操作与异常全量，普通读请求按比例采样）</div>
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
    </div>
  )
}
