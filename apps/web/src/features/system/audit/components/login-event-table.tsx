import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { Tabs, TabsList, TabsTrigger } from '@zen/ui'
import { History, Table2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { DataTable, DataTableToolbar } from '@/components/data-table'
import { flattenPages } from '@/lib/infinite-list'

import { useLoginEvents, useLoginEventsInfiniteQuery } from '../queries'
import { loginEventColumns } from './login-event-columns'
import { LoginEventTimelineView } from './login-event-timeline-view'

import type { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table'
import type { LoginEventQuery } from '../api'

const STATUS_OPTIONS = [
  { label: '登录成功', value: 'true' },
  { label: '登录失败', value: 'false' }
]

interface LoginEventTableProps {
  onRefetchReady?: (refetch: () => void) => void
}

export function LoginEventTable({ onRefetchReady }: LoginEventTableProps) {
  const [params, setParams] = useState<LoginEventQuery>({
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
  } = useLoginEvents(params)
  const tableItems = tableData?.items ?? []
  const totalPages = tableData?.pagination?.totalPages ?? 1

  const infiniteFilters = {
    userId: params.userId,
    identifier: params.identifier,
    success: params.success,
    from: params.from,
    to: params.to
  }

  const {
    data: infiniteData,
    isLoading: isTimelineLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchInfinite
  } = useLoginEventsInfiniteQuery(infiniteFilters)
  const timelineItems = flattenPages(infiniteData)

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

  const handleIdentifierChange = useCallback((value: string) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      identifier: value.trim() || undefined
    }))
  }, [])

  const handleColumnFiltersChange = useCallback(
    (updaterOrValue: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      setColumnFilters((prev) => {
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
        const statusFilter = next.find((f) => f.id === 'success')?.value as string[] | undefined

        setParams((p) => ({
          ...p,
          page: 1,
          success:
            statusFilter && statusFilter.length === 1 ? statusFilter[0] === 'true' : undefined
        }))

        return next
      })
    },
    []
  )

  const table = useReactTable({
    data: tableItems,
    columns: loginEventColumns,
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
        searchPlaceholder="搜索登录账号 / 标识..."
        searchValue={params.identifier}
        onSearchChange={handleIdentifierChange}
        filters={[
          {
            columnId: 'success',
            title: '登录状态',
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
        <LoginEventTimelineView
          items={timelineItems}
          isLoading={isTimelineLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      )}
    </div>
  )
}
