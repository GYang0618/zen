import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import {
  cn,
  ScrollArea,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@zen/ui'

import type { ColumnDef, RowData, Table as TanStackTable } from '@tanstack/react-table'

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

function TableColGroup<TData extends RowData>({ table }: { table: TanStackTable<TData> }) {
  return (
    <colgroup>
      {table.getVisibleLeafColumns().map((column) => (
        <col key={column.id} style={{ width: `${column.getSize()}px` }} />
      ))}
    </colgroup>
  )
}

function AITableRows<TData extends RowData>({
  table,
  columnCount,
  emptyMessage,
  showSkeleton,
  skeletonRowCount
}: {
  table: TanStackTable<TData>
  columnCount: number
  emptyMessage: string
  showSkeleton: boolean
  skeletonRowCount: number
}) {
  const rows = table.getRowModel().rows

  if (showSkeleton) {
    return Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
      <TableRow key={`skeleton-${rowIndex}`}>
        {table.getVisibleLeafColumns().map((column) => (
          <TableCell key={column.id}>
            <Skeleton className="h-5 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ))
  }

  if (!rows.length) {
    return (
      <TableRow>
        <TableCell colSpan={columnCount} className="h-24 text-center">
          {emptyMessage}
        </TableCell>
      </TableRow>
    )
  }

  return rows.map((row) => (
    <TableRow key={row.id}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  ))
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

  const showSkeleton = isLoading && data.length === 0

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border transition-opacity',
        '**:data-[slot=table-container]:contents',
        isFetching && !showSkeleton && 'opacity-70'
      )}
    >
      <Table className="table-fixed">
        <TableColGroup table={table} />
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
      </Table>

      <ScrollArea
        type="hover"
        className="max-h-80 overscroll-contain *:data-[slot=scroll-area-viewport]:h-auto *:data-[slot=scroll-area-viewport]:max-h-80"
      >
        <Table className="table-fixed">
          <TableColGroup table={table} />
          <TableBody>
            <AITableRows
              table={table}
              columnCount={columns.length}
              emptyMessage={emptyMessage}
              showSkeleton={showSkeleton}
              skeletonRowCount={skeletonRowCount}
            />
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
