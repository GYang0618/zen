'use no memo'

import { Cross2Icon } from '@radix-ui/react-icons'
import { Button, Input } from '@zen/ui'
import { useEffect, useState } from 'react'

import { DataTableFacetedFilter } from './faceted-filter'
import { DataTableViewOptions } from './view-options'

import type { Table } from '@tanstack/react-table'

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  searchPlaceholder?: string
  searchKey?: string
  /** 受控外部搜索值（用于服务端搜索）。提供后 searchKey 会被忽略 */
  searchValue?: string
  /** 搜索值变更回调（已 debounce） */
  onSearchChange?: (value: string) => void
  /** 搜索 debounce 毫秒数 */
  searchDebounceMs?: number
  filters?: {
    columnId: Extract<keyof TData, string>
    title: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
  }[]
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = '筛选...',
  searchKey,
  searchValue,
  onSearchChange,
  searchDebounceMs = 300,
  filters = []
}: DataTableToolbarProps<TData>) {
  const isControlledSearch = typeof onSearchChange === 'function'
  const [localSearch, setLocalSearch] = useState(searchValue ?? '')

  useEffect(() => {
    if (!isControlledSearch) return
    setLocalSearch(searchValue ?? '')
  }, [searchValue, isControlledSearch])

  useEffect(() => {
    if (!isControlledSearch) return
    if (localSearch === (searchValue ?? '')) return
    const timer = window.setTimeout(() => {
      onSearchChange?.(localSearch)
    }, searchDebounceMs)
    return () => window.clearTimeout(timer)
  }, [localSearch, searchValue, isControlledSearch, onSearchChange, searchDebounceMs])

  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    Boolean(table.getState().globalFilter) ||
    (isControlledSearch && Boolean(searchValue))

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        {isControlledSearch ? (
          <Input
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        ) : searchKey ? (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        ) : (
          <Input
            placeholder={searchPlaceholder}
            value={table.getState().globalFilter ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        <div className="flex gap-x-2">
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId)
            if (!column) return null
            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
              />
            )
          })}
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
              if (isControlledSearch) {
                setLocalSearch('')
                onSearchChange?.('')
              }
            }}
            className="h-8 px-2 lg:px-3"
          >
            重置
            <Cross2Icon className="ms-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
