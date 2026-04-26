import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import {
  cn,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@zen/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useTableUrlState } from '@/hooks'
import { toOptions } from '@/lib/config-utils'

import { dataScopeConfig, roleStatusConfig } from '../data/data'
import { rolesColumns as columns } from './roles-columns'

import type { SortingState, VisibilityState } from '@tanstack/react-table'
import type { NavigateFn } from '@/hooks'
import type { Role } from '../types'

type RolesSearch = {
  keyword?: string
  page?: number
  pageSize?: number
  status?: string[]
  dataScope?: string[]
}

type DataTableProps = {
  data: Role[]
  total: number
  isLoading?: boolean
  isFetching?: boolean
  search: RolesSearch
  navigate: NavigateFn
}

export function RolesTable({
  data,
  total,
  isLoading = false,
  isFetching = false,
  search,
  navigate
}: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange
  } = useTableUrlState<Role>({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: false },
    columnFilters: [
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'dataScope', searchKey: 'dataScope', type: 'array' }
    ]
  })

  const keyword = typeof search.keyword === 'string' ? search.keyword : ''

  const handleSearchChange = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      navigate({
        search: (prev) => ({
          ...prev,
          page: undefined,
          keyword: trimmed ? trimmed : undefined
        })
      })
    },
    [navigate]
  )

  const pageCount = useMemo(() => {
    if (total <= 0) return 0
    return Math.max(1, Math.ceil(total / pagination.pageSize))
  }, [total, pagination.pageSize])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility
    },
    manualPagination: true,
    rowCount: total,
    pageCount: pageCount || 1,
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  })

  useEffect(() => {
    if (!isLoading) ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange, isLoading])

  const rows = table.getRowModel().rows
  const showSkeleton = isLoading && data.length === 0

  return (
    <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'flex flex-1 flex-col gap-4')}>
      <DataTableToolbar
        table={table}
        searchPlaceholder="搜索角色名称 / 角色编码"
        searchValue={keyword}
        onSearchChange={handleSearchChange}
        filters={[
          {
            columnId: 'status',
            title: '状态',
            options: toOptions(roleStatusConfig)
          },
          {
            columnId: 'dataScope',
            title: '数据范围',
            options: toOptions(dataScopeConfig)
          }
        ]}
      />
      <div
        className={cn(
          'overflow-hidden rounded-md border transition-opacity',
          isFetching && !showSkeleton && 'opacity-70'
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="group/row">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className,
                        header.column.columnDef.meta?.thClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              Array.from({ length: pagination.pageSize }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {table.getVisibleLeafColumns().map((column) => (
                    <TableCell key={column.id} className={column.columnDef.meta?.className}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="group/row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  没有结果.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} className="mt-auto" />
    </div>
  )
}
