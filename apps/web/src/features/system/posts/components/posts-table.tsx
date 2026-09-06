'use no memo'

import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useCallback, useEffect, useState } from 'react'

import { DataTable, DataTableToolbar } from '@/components/data-table'
import { useTableUrlState } from '@/hooks'
import { toOptions } from '@/lib/config-utils'

import { jobProfileStatusConfig } from '../utils'
import { PostsBulkActions } from './posts-bulk-actions'
import { postsColumns as columns } from './posts-columns'

import type { VisibilityState } from '@tanstack/react-table'
import type { JobProfile, JobProfileStatus } from '@zen/shared'
import type { ReactNode } from 'react'
import type { NavigateFn } from '@/hooks'

type PostsSearch = {
  keyword?: string
  page?: number
  pageSize?: number
  status?: JobProfileStatus | JobProfileStatus[]
}

type PostsTableProps = {
  data: JobProfile[]
  isLoading?: boolean
  isFetching?: boolean
  isError?: boolean
  error?: ReactNode
  search: PostsSearch
  navigate: NavigateFn
}

function toFilterArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

export function PostsTable({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  error,
  search,
  navigate
}: PostsTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange
  } = useTableUrlState<JobProfile>({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'keyword', trim: true },
    columnFilters: [
      {
        columnId: 'status',
        searchKey: 'status',
        type: 'array',
        deserialize: (value) => toFilterArray(value as JobProfileStatus | JobProfileStatus[])
      }
    ]
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      onGlobalFilterChange?.(value)
    },
    [onGlobalFilterChange]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility
    },
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const normalizedKeyword = String(filterValue ?? '')
        .trim()
        .toLowerCase()
      if (!normalizedKeyword) return true

      const searchFields = [
        row.original.name,
        row.original.code,
        row.original.family,
        row.original.description
      ]
      return searchFields.some((field) => field?.toLowerCase().includes(normalizedKeyword))
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  })
  const pageCount = table.getPageCount()

  useEffect(() => {
    if (!isLoading) ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange, isLoading])

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      toolbar={
        <DataTableToolbar
          table={table}
          searchPlaceholder="搜索岗位名称、编码或岗位族"
          searchValue={globalFilter ?? undefined}
          onSearchChange={handleSearchChange}
          filters={[
            {
              columnId: 'status',
              title: '状态',
              options: toOptions(jobProfileStatusConfig)
            }
          ]}
        />
      }
      footer={
        <PostsBulkActions
          selectedItems={table.getFilteredSelectedRowModel().rows.map((row) => row.original)}
          onClearSelection={() => table.resetRowSelection()}
        />
      }
    />
  )
}
