'use no memo'

import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { Tabs, TabsList, TabsTrigger } from '@zen/ui'
import { History, Table2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DataTable, DataTableToolbar } from '@/components/data-table'
import { flattenPages } from '@/lib/infinite-list'

import { useAgentRuns, useAgentRunsInfiniteQuery } from '../queries'
import { getAgentRunsColumns } from './agent-runs-columns'
import { AgentRunsTimelineView } from './agent-runs-timeline-view'

import type { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table'
import type { AgentRunQuery } from '../api'

const STATUS_OPTIONS = [
  { label: '执行中', value: 'running' },
  { label: '成功', value: 'succeeded' },
  { label: '失败', value: 'failed' },
  { label: '排队中', value: 'pending' },
  { label: '已取消', value: 'cancelled' }
]

interface AgentRunsTableProps {
  onViewDetail: (runId: string) => void
  onRefetchReady?: (refetch: () => void) => void
}

export function AgentRunsTable({ onViewDetail, onRefetchReady }: AgentRunsTableProps) {
  const [params, setParams] = useState<AgentRunQuery>({
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
  } = useAgentRuns(params)
  const tableItems = tableData?.items ?? []
  const totalPages = tableData?.pagination?.totalPages ?? 1

  const infiniteFilters = useMemo(
    () => ({
      userId: params.userId,
      model: params.model,
      status: params.status,
      from: params.from,
      to: params.to
    }),
    [params.userId, params.model, params.status, params.from, params.to]
  )

  const {
    data: infiniteData,
    isLoading: isTimelineLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchInfinite
  } = useAgentRunsInfiniteQuery(infiniteFilters)

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

  const columns = useMemo(() => getAgentRunsColumns({ onViewDetail }), [onViewDetail])

  const handleColumnFiltersChange = useCallback(
    (updaterOrValue: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      setColumnFilters((prev) => {
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
        const statusFilter = next.find((f) => f.id === 'status')?.value as string[] | undefined

        setParams((p) => ({
          ...p,
          page: 1,
          status: statusFilter && statusFilter.length === 1 ? statusFilter[0] : undefined
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
        filters={[
          {
            columnId: 'status',
            title: '任务状态',
            options: STATUS_OPTIONS
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
        <AgentRunsTimelineView
          items={timelineItems}
          isLoading={isTimelineLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
          onViewDetail={onViewDetail}
        />
      )}
    </div>
  )
}
