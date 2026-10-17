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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  ShieldAlert
} from 'lucide-react'
import { useState } from 'react'

import { useLoginEvents } from '../queries'

import type { LoginEventQuery } from '../api'

function getEventBadge(event: string) {
  if (event.includes('logout')) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <LogOut className="h-3 w-3" />
        账号登出
      </Badge>
    )
  }
  if (event.includes('refresh')) {
    return (
      <Badge variant="secondary" className="gap-1">
        <RefreshCw className="h-3 w-3" />
        Token 刷新
      </Badge>
    )
  }
  if (event.includes('locked')) {
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldAlert className="h-3 w-3" />
        账号锁定
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-foreground">
      <LogIn className="h-3 w-3" />
      用户登录
    </Badge>
  )
}

export function LoginEventTable() {
  const [params, setParams] = useState<LoginEventQuery>({
    page: 1,
    pageSize: 15
  })
  const [identifierInput, setIdentifierInput] = useState('')

  const { data, isLoading, isFetching, refetch } = useLoginEvents(params)
  const items = data?.items ?? []
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  const handleSearch = () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      identifier: identifierInput.trim() || undefined
    }))
  }

  const handleStatusChange = (val: string | null) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      success: !val || val === 'ALL' ? undefined : val === 'SUCCESS'
    }))
  }

  return (
    <div className="space-y-4">
      {/* 搜索过滤工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索登录账号 / 手机号..."
              className="pl-8 text-sm"
              value={identifierInput}
              onChange={(e) => setIdentifierInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleSearch}>
            查询
          </Button>

          <Select
            value={params.success === undefined ? 'ALL' : params.success ? 'SUCCESS' : 'FAILED'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="登录状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部状态</SelectItem>
              <SelectItem value="SUCCESS">登录成功</SelectItem>
              <SelectItem value="FAILED">登录失败</SelectItem>
            </SelectContent>
          </Select>
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
              <TableHead className="w-40">发生时间</TableHead>
              <TableHead className="w-48">登录账号 / 标识</TableHead>
              <TableHead className="w-32">事件类型</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-36">IP 地址</TableHead>
              <TableHead>客户端环境 (UA)</TableHead>
              <TableHead className="w-48">备注 / 失败原因</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Spinner />
                    <span>正在加载登录日志...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  暂无匹配的登录记录
                </TableCell>
              </TableRow>
            ) : (
              items.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-xs text-foreground">
                    {event.identifier}
                  </TableCell>
                  <TableCell>{getEventBadge(event.event)}</TableCell>
                  <TableCell>
                    {event.success ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        成功
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        失败
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3 shrink-0 opacity-60" />
                      <span className="truncate">{event.ip || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-[11px] text-muted-foreground">
                    {event.userAgent || '-'}
                  </TableCell>
                  <TableCell className="text-xs text-destructive">{event.reason || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控制 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>共 {total} 条登录记录</div>
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
