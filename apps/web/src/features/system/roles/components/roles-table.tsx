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

import { dataScopeOptions, roleEffectiveStatusConfig } from '../data/data'
import { RolesBulkActions } from './roles-bulk-actions'
import { rolesColumns as columns } from './roles-columns'

import type { VisibilityState } from '@tanstack/react-table'
import type { Role, RoleDataScope, RoleEffectiveStatus } from '@zen/shared'
import type { ReactNode } from 'react'
import type { NavigateFn } from '@/hooks'

type RolesSearch = {
  keyword?: string
  page?: number
  pageSize?: number
  effectiveStatus?: RoleEffectiveStatus | RoleEffectiveStatus[]
  dataScope?: RoleDataScope | RoleDataScope[]
}

type RolesTableProps = {
  data: Role[]
  isLoading?: boolean
  isFetching?: boolean
  isError?: boolean
  error?: ReactNode
  search: RolesSearch
  navigate: NavigateFn
}

function toFilterArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

export function RolesTable({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  error,
  search,
  navigate
}: RolesTableProps) {
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
  } = useTableUrlState<Role>({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'keyword', trim: true },
    columnFilters: [
      {
        columnId: 'effectiveStatus',
        searchKey: 'effectiveStatus',
        type: 'array',
        deserialize: (value) => toFilterArray(value as RoleEffectiveStatus | RoleEffectiveStatus[])
      },
      {
        columnId: 'dataScope',
        searchKey: 'dataScope',
        type: 'array',
        deserialize: (value) => toFilterArray(value as RoleDataScope | RoleDataScope[])
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

      const searchFields = [row.original.name, row.original.code, row.original.description]
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
          searchPlaceholder="搜索角色名称或编码"
          searchValue={globalFilter ?? undefined}
          onSearchChange={handleSearchChange}
          filters={[
            {
              columnId: 'effectiveStatus',
              title: '状态',
              options: toOptions(roleEffectiveStatusConfig)
            },
            {
              columnId: 'dataScope',
              title: '数据范围',
              options: dataScopeOptions.map((item) => ({
                label: item.label,
                value: item.value,
                icon: item.icon
              }))
            }
          ]}
        />
      }
      footer={
        <RolesBulkActions
          selectedItems={table.getFilteredSelectedRowModel().rows.map((row) => row.original)}
          onClearSelection={() => table.resetRowSelection()}
        />
      }
    />
  )
}
