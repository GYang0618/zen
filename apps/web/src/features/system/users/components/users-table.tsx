'use no memo'

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
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

import { roleConfig, statusConfig } from '../data/data'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { usersColumns as columns } from './users-columns'

import type { OnChangeFn, SortingState, VisibilityState } from '@tanstack/react-table'
import type { User, UsersQuery as UsersSearch, UsersSortBy, UsersSortOrder } from '@zen/shared'
import type { NavigateFn } from '@/hooks'

const USERS_SORTABLE_COLUMNS: Record<UsersSortBy, true> = {
  username: true,
  email: true,
  jobTitle: true,
  createdAt: true
}

function toUsersSortBy(columnId?: string): UsersSortBy | undefined {
  if (!columnId) return undefined
  return columnId in USERS_SORTABLE_COLUMNS ? (columnId as UsersSortBy) : undefined
}

type DataTableProps = {
  data: User[]
  isLoading?: boolean
  isFetching?: boolean
  search: UsersSearch
  navigate: NavigateFn
}

export function UsersTable({
  data,
  isLoading = false,
  isFetching = false,
  search,
  navigate
}: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const sorting = useMemo<SortingState>(() => {
    if (!search.sortBy) return []
    return [{ id: search.sortBy, desc: search.sortOrder !== 'asc' }]
  }, [search.sortBy, search.sortOrder])

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange
  } = useTableUrlState<User>({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'keyword', trim: true },
    columnFilters: [
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'role', searchKey: 'role', type: 'array' }
    ]
  })

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const nextSorting = typeof updater === 'function' ? updater(sorting) : updater
      const nextSort = nextSorting[0]
      const sortBy = toUsersSortBy(nextSort?.id)
      const sortOrder: UsersSortOrder | undefined = sortBy
        ? nextSort?.desc
          ? 'desc'
          : 'asc'
        : undefined
      navigate({
        search: (prev) => ({
          ...prev,
          page: undefined,
          sortBy,
          sortOrder
        })
      })
    },
    [navigate, sorting]
  )

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
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility
    },
    enableRowSelection: true,
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const normalizedKeyword = String(filterValue ?? '')
        .trim()
        .toLowerCase()
      if (!normalizedKeyword) return true

      const searchFields = [
        row.original.username,
        row.original.nickname,
        row.original.email,
        row.original.phoneNumber
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

  const rows = table.getRowModel().rows
  const showSkeleton = isLoading && data.length === 0

  return (
    <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'flex flex-1 flex-col gap-4')}>
      <DataTableToolbar
        table={table}
        searchPlaceholder="搜索用户名、昵称、邮箱、手机号"
        searchValue={globalFilter ?? undefined}
        onSearchChange={handleSearchChange}
        filters={[
          {
            columnId: 'status',
            title: '状态',
            options: toOptions(statusConfig)
          },
          {
            columnId: 'role',
            title: '角色',
            options: toOptions(roleConfig)
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
      <DataTableBulkActions table={table} />
    </div>
  )
}
