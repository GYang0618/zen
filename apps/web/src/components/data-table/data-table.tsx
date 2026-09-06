import { flexRender } from '@tanstack/react-table'
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
import { useCallback, useState } from 'react'

import { DataTablePagination } from './pagination'

import type { Table as TanStackTable } from '@tanstack/react-table'
import type { KeyboardEvent, ReactNode } from 'react'

interface DataTableProps<TData> {
  table: TanStackTable<TData>
  toolbar?: ReactNode
  footer?: ReactNode
  isFetching?: boolean
  isLoading?: boolean
  isError?: boolean
  error?: ReactNode
  empty?: ReactNode
  className?: string
}

export function DataTable<TData>({
  table,
  toolbar,
  footer,
  isFetching = false,
  isLoading = false,
  isError = false,
  error = '加载失败，请重试。',
  empty = '没有结果.',
  className
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows
  const showSkeleton = isLoading && rows.length === 0
  const pageSize = table.getState().pagination.pageSize
  const [activeRowId, setActiveRowId] = useState<string>()

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableElement>) => {
      if (rows.length === 0) return
      const currentIndex = rows.findIndex((row) => row.id === activeRowId)
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const next = rows[currentIndex < 0 ? 0 : Math.min(rows.length - 1, currentIndex + 1)]
        if (next) setActiveRowId(next.id)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const next = rows[currentIndex < 0 ? rows.length - 1 : Math.max(0, currentIndex - 1)]
        if (next) setActiveRowId(next.id)
      }
      if (event.key === ' ' || event.key === 'Enter') {
        const row = currentIndex >= 0 ? rows[currentIndex] : rows[0]
        if (row && table.options.enableRowSelection) {
          event.preventDefault()
          row.toggleSelected()
        }
      }
    },
    [activeRowId, rows, table.options.enableRowSelection]
  )

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4',
        className
      )}
    >
      {toolbar}
      <div
        className={cn(
          'overflow-auto rounded-md border transition-opacity max-h-[min(70vh,40rem)]',
          isFetching && !showSkeleton && 'opacity-70'
        )}
      >
        <Table tabIndex={0} aria-label="数据表格" onKeyDown={onKeyDown}>
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
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {table.getVisibleLeafColumns().map((column) => (
                    <TableCell key={column.id} className={column.columnDef.meta?.className}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center text-destructive"
                  role="alert"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  data-active={row.id === activeRowId}
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
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center"
                >
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className="mt-auto" />
      {footer}
    </div>
  )
}
