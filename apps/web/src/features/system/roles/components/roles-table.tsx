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
import { useCallback, useEffect, useState } from 'react'

import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { useTableUrlState } from '@/hooks'
import { toOptions } from '@/lib/config-utils'

import { dataScopeOptions, roleEffectiveStatusConfig } from '../data/data'
import { rolesColumns as columns } from './roles-columns'

import type { VisibilityState } from '@tanstack/react-table'
import type { Role, RoleDataScope, RoleEffectiveStatus } from '@zen/shared'
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
  search,
  navigate
}: RolesTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

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
      columnFilters,
      columnVisibility
    },
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
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

  const rows = table.getRowModel().rows
  const showSkeleton = isLoading && data.length === 0

  return (
    <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'flex flex-1 flex-col gap-4')}>
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
                {headerGroup.headers.map((header) => (
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
                ))}
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
                <TableRow key={row.id} className="group/row">
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
