import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@zen/ui'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import { createColumnsFromDefinitions } from './table-columns'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type {
  ColumnDef,
  Header,
  OnChangeFn,
  RowData,
  SortingState,
  Table as TanStackTable
} from '@tanstack/react-table'
import type { ReactNode } from 'react'
import type { A2uiColumnDefinition } from './table-columns'

const DEFAULT_SKELETON_ROWS = 5

export interface DataTableProps<TData extends RowData, TValue = unknown> {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
  isLoading?: boolean
  isFetching?: boolean
  skeletonRowCount?: number
  emptyMessage?: ReactNode
  className?: string
  enableSorting?: boolean
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
}

interface DataTableHeaderCellProps<TData extends RowData, TValue> {
  header: Header<TData, TValue>
}

function DataTableHeaderCell<TData extends RowData, TValue>({
  header
}: DataTableHeaderCellProps<TData, TValue>) {
  if (header.isPlaceholder) {
    return null
  }

  const renderedContent = flexRender(header.column.columnDef.header, header.getContext())
  const canSort = header.column.getCanSort()
  const isTextHeader = typeof renderedContent === 'string' || typeof renderedContent === 'number'

  if (!canSort || !isTextHeader) {
    return renderedContent
  }

  const isSorted = header.column.getIsSorted()

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer select-none text-left py-1 px-1 -ml-1 rounded hover:bg-muted/60',
        isSorted ? 'text-foreground font-semibold' : 'hover:text-foreground'
      )}
      onClick={header.column.getToggleSortingHandler()}
      aria-label={`按${renderedContent}排序`}
    >
      <span>{renderedContent}</span>
      {isSorted === 'asc' ? (
        <ArrowUp className="size-3.5 shrink-0 text-primary" />
      ) : isSorted === 'desc' ? (
        <ArrowDown className="size-3.5 shrink-0 text-primary" />
      ) : (
        <ArrowUpDown className="size-3.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity" />
      )}
    </button>
  )
}

interface DataTableRowsProps<TData extends RowData> {
  table: TanStackTable<TData>
  columnCount: number
  emptyMessage: ReactNode
  showSkeleton: boolean
  skeletonRowCount: number
}

function DataTableRows<TData extends RowData>({
  table,
  columnCount,
  emptyMessage,
  showSkeleton,
  skeletonRowCount
}: DataTableRowsProps<TData>) {
  if (showSkeleton) {
    const leafColumns = table.getVisibleLeafColumns()
    const cols = leafColumns.length > 0 ? leafColumns : Array.from({ length: columnCount })

    return Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
      <TableRow key={`skeleton-row-${rowIndex}`}>
        {cols.map((col, colIndex) => {
          const colId =
            typeof col === 'object' && col !== null && 'id' in col
              ? String((col as { id: unknown }).id)
              : `col-${colIndex}`
          return (
            <TableCell key={colId}>
              <Skeleton className="h-5 w-full rounded" />
            </TableCell>
          )
        })}
      </TableRow>
    ))
  }

  const rows = table.getRowModel().rows

  if (rows.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={columnCount} className="h-24 text-center text-sm text-muted-foreground">
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

export function DataTable<TData extends RowData, TValue = unknown>({
  data,
  columns,
  isLoading = false,
  isFetching = false,
  skeletonRowCount = DEFAULT_SKELETON_ROWS,
  emptyMessage = '暂无数据',
  className,
  enableSorting = true,
  sorting,
  onSortingChange
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])

  const currentSorting = sorting ?? internalSorting
  const handleSortingChange: OnChangeFn<SortingState> = onSortingChange ?? setInternalSorting

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: currentSorting
    },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting,
    sortDescFirst: false
  })

  const showSkeleton = isLoading && data.length === 0

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-md border transition-opacity bg-card',
        isFetching && !showSkeleton && 'opacity-70',
        className
      )}
    >
      <div className="w-full overflow-auto overscroll-contain">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    <DataTableHeaderCell header={header} />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <DataTableRows
              table={table}
              columnCount={columns.length}
              emptyMessage={emptyMessage}
              showSkeleton={showSkeleton}
              skeletonRowCount={skeletonRowCount}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/**
 * A2UI 声明式 DataTable 组件 Props 契约
 */
export interface A2uiDataTableProps {
  title?: string
  description?: string
  columns: A2uiColumnDefinition[]
  data: Record<string, unknown>[]
  enableSorting?: boolean
  emptyMessage?: string
}

/**
 * A2UI 渲染器组件
 */
export function A2uiDataTable({ props }: RendererProps<A2uiDataTableProps>) {
  const { title, description, columns = [], data = [], enableSorting = true, emptyMessage } = props

  const dynamicColumns = useMemo(() => createColumnsFromDefinitions(columns), [columns])

  const tableElement = (
    <DataTable
      data={data}
      columns={dynamicColumns}
      enableSorting={enableSorting}
      emptyMessage={emptyMessage ?? '暂无数据'}
    />
  )

  if (title || description) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="pt-0">{tableElement}</CardContent>
      </Card>
    )
  }

  return tableElement
}
