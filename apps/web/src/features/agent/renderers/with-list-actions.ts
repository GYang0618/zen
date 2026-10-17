import type { ColumnDef } from '@tanstack/react-table'
import type { ReactNode } from 'react'

/** 复用业务列表的列定义，只替换操作列，并去掉仅供批量选择的勾选列。 */
export function withListActions<T>(
  columns: ColumnDef<T>[],
  renderActions: (item: T) => ReactNode
): ColumnDef<T>[] {
  return columns.flatMap((column) => {
    if (column.id === 'select') return []
    if (column.id !== 'actions') return [column]
    return [
      {
        ...column,
        cell: ({ row }) => renderActions(row.original)
      }
    ]
  })
}
