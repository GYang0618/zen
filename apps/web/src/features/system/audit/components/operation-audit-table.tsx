'use no memo'

import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { Badge, Tabs, TabsList, TabsTrigger } from '@zen/ui'
import { Bot, History, Table2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DataTable, DataTableToolbar } from '@/components/data-table'
import { flattenPages } from '@/lib/infinite-list'

import { useAuditInfiniteQuery, useAuditList } from '../queries'
import { getOperationAuditColumns } from './operation-audit-columns'
import { OperationAuditTimelineView } from './operation-audit-timeline-view'
import { OperationAuditWorkspaceLayout } from './operation-audit-workspace-layout'

import type { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table'
import type { AuditLogItem, AuditQuery } from '../api'

const ACTOR_TYPE_OPTIONS = [
  { label: '自然人', value: 'user' },
  { label: 'AI Agent', value: 'agent' },
  { label: '系统内核', value: 'system' }
]

const RESULT_OPTIONS = [
  { label: '执行成功', value: 'SUCCESS' },
  { label: '执行失败', value: 'FAILURE' },
  { label: '权限拒绝', value: 'DENIED' }
]

interface OperationAuditTableProps {
  initialAgentRunId?: string
  onNavigateAgentRun?: (runId: string) => void
  onRefetchReady?: (refetch: () => void) => void
}

export function OperationAuditTable({
  initialAgentRunId,
  onNavigateAgentRun,
  onRefetchReady
}: OperationAuditTableProps) {
  const [params, setParams] = useState<AuditQuery>({
    page: 1,
    pageSize: 10,
    agentRunId: initialAgentRunId
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [activeLog, setActiveLog] = useState<AuditLogItem | null>(null)
  const [view, setView] = useState<'table' | 'timeline'>('table')

  const {
    data: tableData,
    isLoading: isTableLoading,
    isFetching: isTableFetching,
    refetch: refetchTable
  } = useAuditList(params)
  const tableItems = tableData?.items ?? []
  const totalPages = tableData?.pagination?.totalPages ?? 1

  const infiniteFilters = useMemo(
    () => ({
      keyword: params.keyword,
      actorType: params.actorType,
      result: params.result,
      agentRunId: params.agentRunId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      from: params.from,
      to: params.to
    }),
    [
      params.keyword,
      params.actorType,
      params.result,
      params.agentRunId,
      params.action,
      params.resource,
      params.resourceId,
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
  } = useAuditInfiniteQuery(infiniteFilters)
  const timelineItems = useMemo(() => flattenPages(infiniteData), [infiniteData])

  // 供外部父级调用刷新
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

  const handleToggleDetail = useCallback((log: AuditLogItem) => {
    setActiveLog((prev) => (prev?.id === log.id ? null : log))
  }, [])

  const columns = useMemo(() => getOperationAuditColumns(), [])

  const handleKeywordChange = useCallback((value: string) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      keyword: value.trim() || undefined
    }))
  }, [])

  const handleColumnFiltersChange = useCallback(
    (updaterOrValue: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      setColumnFilters((prev) => {
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
        const actorFilter = next.find((f) => f.id === 'actorType')?.value as string[] | undefined
        const resultFilter = next.find((f) => f.id === 'result')?.value as string[] | undefined

        setParams((p) => ({
          ...p,
          page: 1,
          actorType:
            actorFilter && actorFilter.length === 1
              ? (actorFilter[0] as AuditQuery['actorType'])
              : undefined,
          result:
            resultFilter && resultFilter.length === 1
              ? (resultFilter[0] as AuditQuery['result'])
              : undefined
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
      {params.agentRunId && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 py-1 px-2.5"
          >
            <Bot className="h-3.5 w-3.5" />
            已关联 Agent 任务: {params.agentRunId}
            <button
              type="button"
              className="ml-1 rounded-sm opacity-70 ring-offset-background hover:opacity-100"
              onClick={() => setParams((p) => ({ ...p, agentRunId: undefined }))}
              title="清除过滤"
            >
              ×
            </button>
          </Badge>
        </div>
      )}

      {/* 顶部搜索栏与双视图切换控制（横跨全宽） */}
      <DataTableToolbar
        table={table}
        searchPlaceholder="搜索操作人、描述或关联资源..."
        searchValue={params.keyword}
        onSearchChange={handleKeywordChange}
        filters={[
          {
            columnId: 'actorType',
            title: '操作主体',
            options: ACTOR_TYPE_OPTIONS
          },
          {
            columnId: 'result',
            title: '执行结果',
            options: RESULT_OPTIONS
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

      {/* 工作区：左侧是表格/时间线，右侧是详情面板。两者顶部完全处于同一水平线 */}
      <OperationAuditWorkspaceLayout
        activeLog={activeLog}
        onClose={() => setActiveLog(null)}
        onNavigateAgentRun={onNavigateAgentRun}
      >
        {view === 'table' ? (
          <DataTable
            table={table}
            isLoading={isTableLoading}
            isFetching={isTableFetching}
            onRowClick={handleToggleDetail}
          />
        ) : (
          <OperationAuditTimelineView
            items={timelineItems}
            isLoading={isTimelineLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
            activeLogId={activeLog?.id}
            onSelectLog={handleToggleDetail}
          />
        )}
      </OperationAuditWorkspaceLayout>
    </div>
  )
}
