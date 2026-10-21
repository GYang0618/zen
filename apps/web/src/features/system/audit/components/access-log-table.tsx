import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { Tabs, TabsList, TabsTrigger } from '@zen/ui'
import { History, Table2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DataTable, DataTableToolbar } from '@/components/data-table'
import { flattenPages } from '@/lib/infinite-list'

import { useAccessLogs, useAccessLogsInfiniteQuery } from '../queries'
import { getAccessLogColumns } from './access-log-columns'
import { AccessLogTimelineView } from './access-log-timeline-view'

import type { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table'
import type { ApiAccessLogQuery } from '../api'

const METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
]

const STATUS_GROUPS = [
  {
    heading: '正常状态 (2xx / 3xx)',
    quickAction: {
      label: '正常',
      values: ['200', '201', '204', '301', '302', '304']
    },
    options: [
      { label: '200 OK', value: '200' },
      { label: '201 Created', value: '201' },
      { label: '204 No Content', value: '204' },
      { label: '301 Moved Permanently', value: '301' },
      { label: '302 Found', value: '302' },
      { label: '304 Not Modified', value: '304' }
    ]
  },
  {
    heading: '异常状态 (4xx / 5xx)',
    quickAction: {
      label: '异常',
      values: ['400', '401', '403', '404', '422', '429', '500', '502', '503', '504']
    },
    options: [
      { label: '400 Bad Request', value: '400' },
      { label: '401 Unauthorized', value: '401' },
      { label: '403 Forbidden', value: '403' },
      { label: '404 Not Found', value: '404' },
      { label: '422 Unprocessable', value: '422' },
      { label: '429 Too Many Requests', value: '429' },
      { label: '500 Internal Error', value: '500' },
      { label: '502 Bad Gateway', value: '502' },
      { label: '503 Service Unavailable', value: '503' },
      { label: '504 Gateway Timeout', value: '504' }
    ]
  }
]

const LATENCY_OPTIONS = [
  { label: '正常 (< 300ms)', value: 'normal' },
  { label: '较慢 (300ms - 1000ms)', value: 'sluggish' },
  { label: '慢请求 (1s - 3s)', value: 'slow' },
  { label: '严重延迟 (> 3s)', value: 'critical' }
]

interface AccessLogTableProps {
  onNavigateAgentRun?: (runId: string) => void
  onRefetchReady?: (refetch: () => void) => void
}

export function AccessLogTable({ onNavigateAgentRun, onRefetchReady }: AccessLogTableProps) {
  const [params, setParams] = useState<ApiAccessLogQuery>({
    page: 1,
    pageSize: 10
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [view, setView] = useState<'table' | 'timeline'>('table')

  const {
    data: tableData,
    isLoading: isTableLoading,
    isFetching: isTableFetching,
    refetch: refetchTable
  } = useAccessLogs(params)
  const tableItems = tableData?.items ?? []
  const totalPages = tableData?.pagination?.totalPages ?? 1

  const infiniteFilters = useMemo(
    () => ({
      method: params.method,
      route: params.route,
      userId: params.userId,
      callerType: params.callerType,
      statuses: params.statuses,
      minLatencyMs: params.minLatencyMs,
      maxLatencyMs: params.maxLatencyMs,
      from: params.from,
      to: params.to
    }),
    [
      params.method,
      params.route,
      params.userId,
      params.callerType,
      params.statuses,
      params.minLatencyMs,
      params.maxLatencyMs,
      params.from,
      params.to
    ]
  )

  const {
    data: infiniteData,
    isLoading: isTimelineLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchInfinite
  } = useAccessLogsInfiniteQuery(infiniteFilters)

  const timelineItems = useMemo(() => flattenPages(infiniteData), [infiniteData])

  const handleRefetch = useCallback(() => {
    if (view === 'table') {
      void refetchTable()
    } else {
      void refetchInfinite()
    }
  }, [view, refetchTable, refetchInfinite])

  useEffect(() => {
    onRefetchReady?.(handleRefetch)
  }, [onRefetchReady, handleRefetch])

  const columns = useMemo(() => getAccessLogColumns(onNavigateAgentRun), [onNavigateAgentRun])

  const handleRouteChange = useCallback((value: string) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      route: value.trim() || undefined
    }))
  }, [])

  const handleColumnFiltersChange = useCallback(
    (updaterOrValue: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      setColumnFilters((prev) => {
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
        const methodFilter = next.find((f) => f.id === 'method')?.value as string[] | undefined
        const statusFilter = next.find((f) => f.id === 'status')?.value as string[] | undefined
        const latencyFilter = next.find((f) => f.id === 'latencyMs')?.value as string[] | undefined

        let minLatencyMs: number | undefined
        let maxLatencyMs: number | undefined

        if (latencyFilter && latencyFilter.length > 0) {
          const mins: number[] = []
          const maxs: number[] = []
          let hasNoMax = false
          for (const v of latencyFilter) {
            if (v === 'normal') {
              mins.push(0)
              maxs.push(300)
            } else if (v === 'sluggish') {
              mins.push(300)
              maxs.push(1000)
            } else if (v === 'slow') {
              mins.push(1000)
              maxs.push(3000)
            } else if (v === 'critical') {
              mins.push(3000)
              hasNoMax = true
            }
          }
          const minVal = Math.min(...mins)
          minLatencyMs = minVal > 0 ? minVal : undefined
          maxLatencyMs = hasNoMax ? undefined : Math.max(...maxs)
        }

        const statuses =
          statusFilter && statusFilter.length > 0 ? statusFilter.map(Number) : undefined

        setParams((p) => ({
          ...p,
          page: 1,
          method: methodFilter && methodFilter.length === 1 ? methodFilter[0] : undefined,
          statuses,
          status: undefined,
          onlyErrors: undefined,
          minLatencyMs,
          maxLatencyMs
        }))

        return next
      })
    },
    []
  )

  const table = useReactTable({
    data: tableItems,
    columns,
    pageCount: totalPages,
    state: {
      sorting,
      pagination: {
        pageIndex: (params.page ?? 1) - 1,
        pageSize: params.pageSize ?? 10
      },
      columnVisibility,
      columnFilters
    },
    manualPagination: true,
    manualFiltering: true,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const current = {
        pageIndex: (params.page ?? 1) - 1,
        pageSize: params.pageSize ?? 10
      }
      const next = typeof updater === 'function' ? updater(current) : updater
      setParams((prev) => ({
        ...prev,
        page: next.pageIndex + 1,
        pageSize: next.pageSize
      }))
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: handleColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchPlaceholder="过滤接口路由路径..."
        searchValue={params.route}
        onSearchChange={handleRouteChange}
        filters={[
          {
            columnId: 'method',
            title: '请求方法',
            options: METHOD_OPTIONS
          },
          {
            columnId: 'status',
            title: '状态码',
            groups: STATUS_GROUPS,
            contentClassName: 'w-64'
          },
          {
            columnId: 'latencyMs',
            title: '响应耗时',
            options: LATENCY_OPTIONS,
            contentClassName: 'w-56'
          }
        ]}
        viewSwitch={
          <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'timeline')}>
            <TabsList className="h-8">
              <TabsTrigger value="table" className="h-7 px-2" aria-label="表格视图">
                <Table2 className="size-3.5" />
              </TabsTrigger>
              <TabsTrigger value="timeline" className="h-7 px-2" aria-label="时间线视图">
                <History className="size-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {view === 'table' ? (
        <DataTable table={table} isLoading={isTableLoading} isFetching={isTableFetching} />
      ) : (
        <AccessLogTimelineView
          items={timelineItems}
          isLoading={isTimelineLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
          onNavigateAgentRun={onNavigateAgentRun}
        />
      )}
    </div>
  )
}
