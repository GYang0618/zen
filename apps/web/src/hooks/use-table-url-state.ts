import { useEffect, useMemo, useRef, useState } from 'react'

import type { ColumnFiltersState, OnChangeFn, PaginationState } from '@tanstack/react-table'

type SearchRecord = Record<string, unknown>

type ColumnFilterConfig<TData extends SearchRecord> =
  | {
      columnId: Extract<keyof TData, string>
      searchKey: string
      type?: 'string'
      // 可选的转换器用于自定义类型
      serialize?: (value: unknown) => unknown
      deserialize?: (value: unknown) => unknown
    }
  | {
      columnId: Extract<keyof TData, string>
      searchKey: string
      type: 'array'
      serialize?: (value: unknown) => unknown
      deserialize?: (value: unknown) => unknown
    }

export type NavigateFn = (opts: {
  search: true | SearchRecord | ((prev: SearchRecord) => Partial<SearchRecord> | SearchRecord)
  replace?: boolean
}) => void

type UseTableUrlStateParams<TData extends SearchRecord = SearchRecord> = {
  search: SearchRecord
  navigate: NavigateFn
  pagination?: {
    pageKey?: string
    pageSizeKey?: string
    defaultPage?: number
    defaultPageSize?: number
  }
  globalFilter?: {
    enabled?: boolean
    key?: string
    trim?: boolean
  }
  columnFilters?: Array<ColumnFilterConfig<TData>>
}

type UseTableUrlStateReturn = {
  // 全局过滤器
  globalFilter?: string
  onGlobalFilterChange?: OnChangeFn<string>
  // 列过滤器
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  // 分页
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  // 辅助函数
  ensurePageInRange: (pageCount: number, opts?: { resetTo?: 'first' | 'last' }) => void
}

function buildColumnFiltersFromSearch<TData extends SearchRecord>(
  search: SearchRecord,
  columnFiltersCfg: Array<ColumnFilterConfig<TData>>
): ColumnFiltersState {
  const collected: ColumnFiltersState = []
  for (const cfg of columnFiltersCfg) {
    const raw = search[cfg.searchKey]
    const deserialize = cfg.deserialize ?? ((v: unknown) => v)
    if (cfg.type === 'string') {
      const value = (deserialize(raw) as string) ?? ''
      if (typeof value === 'string' && value.trim() !== '') {
        collected.push({ id: cfg.columnId, value })
      }
    } else {
      const value = (deserialize(raw) as unknown[]) ?? []
      if (Array.isArray(value) && value.length > 0) {
        collected.push({ id: cfg.columnId, value })
      }
    }
  }
  return collected
}

export function useTableUrlState<TData extends SearchRecord = SearchRecord>(
  params: UseTableUrlStateParams<TData>
): UseTableUrlStateReturn {
  const {
    search,
    navigate,
    pagination: paginationCfg = {},
    globalFilter: globalFilterCfg = {},
    columnFilters: columnFiltersCfg = []
  } = params

  const {
    pageKey = 'page',
    pageSizeKey = 'pageSize',
    defaultPage = 1,
    defaultPageSize = 10
  } = paginationCfg

  const {
    key: globalFilterKey = 'filter',
    enabled: globalFilterEnabled = true,
    trim: trimGlobal = true
  } = globalFilterCfg

  // const pageKey = paginationCfg?.pageKey ?? ('page' as string)
  // const pageSizeKey = paginationCfg?.pageSizeKey ?? ('pageSize' as string)
  // const defaultPage = paginationCfg?.defaultPage ?? 1
  // const defaultPageSize = paginationCfg?.defaultPageSize ?? 10

  // const globalFilterKey = globalFilterCfg?.key ?? ('filter' as string)
  // const globalFilterEnabled = globalFilterCfg?.enabled ?? true
  // const trimGlobal = globalFilterCfg?.trim ?? true

  // 用内容序列化做依赖：router 的 search 常是每帧新对象，若用引用作 effect 依赖会死循环
  const urlTableSyncKey = JSON.stringify({
    columnRaw: columnFiltersCfg.map((cfg) => (search as SearchRecord)[cfg.searchKey]),
    globalRaw: globalFilterEnabled ? (search as SearchRecord)[globalFilterKey] : undefined
  })

  const urlSyncRef = useRef({
    search: search as SearchRecord,
    columnFiltersCfg,
    globalFilterEnabled,
    globalFilterKey
  })
  urlSyncRef.current = {
    search: search as SearchRecord,
    columnFiltersCfg,
    globalFilterEnabled,
    globalFilterKey
  }

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    buildColumnFiltersFromSearch(search as SearchRecord, columnFiltersCfg)
  )

  const [globalFilter, setGlobalFilter] = useState<string | undefined>(() => {
    if (!globalFilterEnabled) return undefined
    const raw = search[globalFilterKey]
    return typeof raw === 'string' ? raw : ''
  })

  useEffect(() => {
    // 依赖 urlTableSyncKey：router 的 search 引用不稳定，用序列化键触发同步
    void urlTableSyncKey
    const {
      search: s,
      columnFiltersCfg: cfg,
      globalFilterEnabled: gfOn,
      globalFilterKey: gfKey
    } = urlSyncRef.current
    setColumnFilters(buildColumnFiltersFromSearch(s, cfg))
    if (!gfOn) return
    const raw = s[gfKey]
    const next = typeof raw === 'string' ? raw : ''
    setGlobalFilter((prev) => (prev === next ? prev : next))
  }, [urlTableSyncKey])

  const pagination: PaginationState = useMemo(() => {
    const rawPage = search[pageKey]
    const rawPageSize = search[pageSizeKey]
    const pageNum = typeof rawPage === 'number' ? rawPage : defaultPage
    const pageSizeNum = typeof rawPageSize === 'number' ? rawPageSize : defaultPageSize
    return { pageIndex: Math.max(0, pageNum - 1), pageSize: pageSizeNum }
  }, [search, pageKey, pageSizeKey, defaultPage, defaultPageSize])

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater
    const nextPage = next.pageIndex + 1
    const nextPageSize = next.pageSize
    navigate({
      search: (prev) => ({
        ...prev,
        [pageKey]: nextPage <= defaultPage ? undefined : nextPage,
        [pageSizeKey]: nextPageSize === defaultPageSize ? undefined : nextPageSize
      })
    })
  }

  const onGlobalFilterChange: OnChangeFn<string> | undefined = globalFilterEnabled
    ? (updater) => {
        const next = typeof updater === 'function' ? updater(globalFilter ?? '') : updater
        const value = trimGlobal ? next.trim() : next
        setGlobalFilter(value)
        navigate({
          search: (prev) => ({
            ...prev,
            [pageKey]: undefined,
            [globalFilterKey]: value ? value : undefined
          })
        })
      }
    : undefined

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next = typeof updater === 'function' ? updater(columnFilters) : updater
    setColumnFilters(next)

    const patch: Record<string, unknown> = {}

    for (const cfg of columnFiltersCfg) {
      const found = next.find((f) => f.id === cfg.columnId)
      const serialize = cfg.serialize ?? ((v: unknown) => v)
      if (cfg.type === 'string') {
        const value = typeof found?.value === 'string' ? (found.value as string) : ''
        patch[cfg.searchKey] = value.trim() !== '' ? serialize(value) : undefined
      } else {
        const value = Array.isArray(found?.value) ? (found!.value as unknown[]) : []
        patch[cfg.searchKey] = value.length > 0 ? serialize(value) : undefined
      }
    }

    navigate({
      search: (prev) => ({
        ...prev,
        [pageKey]: undefined,
        ...patch
      })
    })
  }

  const ensurePageInRange = (
    pageCount: number,
    opts: { resetTo?: 'first' | 'last' } = { resetTo: 'first' }
  ) => {
    const currentPage = search[pageKey]
    const pageNum = typeof currentPage === 'number' ? currentPage : defaultPage
    if (pageCount > 0 && pageNum > pageCount) {
      navigate({
        replace: true,
        search: (prev) => ({
          ...prev,
          [pageKey]: opts.resetTo === 'last' ? pageCount : undefined
        })
      })
    }
  }

  return {
    globalFilter: globalFilterEnabled ? (globalFilter ?? '') : undefined,
    columnFilters,
    pagination,
    onGlobalFilterChange,
    onColumnFiltersChange,
    onPaginationChange,
    ensurePageInRange
  }
}
