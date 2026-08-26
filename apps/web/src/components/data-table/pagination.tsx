'use no memo'

import { ListPagination } from './list-pagination'

import type { Table } from '@tanstack/react-table'

type DataTablePaginationProps<TData> = {
  table: Table<TData>
  className?: string
}

export function DataTablePagination<TData>({ table, className }: DataTablePaginationProps<TData>) {
  return (
    <ListPagination
      page={table.getState().pagination.pageIndex + 1}
      pageCount={table.getPageCount()}
      pageSize={table.getState().pagination.pageSize}
      onPageChange={(nextPage) => table.setPageIndex(nextPage - 1)}
      onPageSizeChange={(nextSize) => table.setPageSize(nextSize)}
      sizeLabel="每页行数"
      className={className}
    />
  )
}
