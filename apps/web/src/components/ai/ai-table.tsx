import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
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

import type { ColumnDef, RowData } from '@tanstack/react-table'

const DEFAULT_SKELETON_ROWS = 10

export interface AITableProps<TData extends RowData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  emptyMessage?: string
  isLoading?: boolean
  isFetching?: boolean
  /** 骨架屏行数，与 users-table 初次加载占位一致 */
  skeletonRowCount?: number
}

export function AITable<TData extends RowData>({
  data,
  columns,
  emptyMessage = '暂无数据',
  isLoading = false,
  isFetching = false,
  skeletonRowCount = DEFAULT_SKELETON_ROWS
}: AITableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  const rows = table.getRowModel().rows
  const showSkeleton = isLoading && data.length === 0

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border transition-opacity',
        isFetching && !showSkeleton && 'opacity-70'
      )}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
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
            Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {table.getVisibleLeafColumns().map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
