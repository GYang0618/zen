'use no memo'

import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DataTable, DataTableToolbar } from '@/components/data-table'
import { useTableUrlState } from '@/hooks'
import { toOptions } from '@/lib/config-utils'

import { statusConfig } from '../data/data'
import { useRoleOptionsQuery } from '../queries'
import { UsersBulkActions } from './users-bulk-actions'
import { usersColumns as columns } from './users-columns'

import type { OnChangeFn, SortingState, VisibilityState } from '@tanstack/react-table'
import type { User, UsersQuery as UsersSearch, UsersSortBy, UsersSortOrder } from '@zen/shared'
import type { ReactNode } from 'react'
import type { NavigateFn } from '@/hooks'

const USERS_SORTABLE_COLUMNS: Record<UsersSortBy, true> = {
  username: true,
  email: true,
  lastLoginAt: true,
  lastActiveAt: true,
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
  isError?: boolean
  error?: ReactNode
  search: UsersSearch
  navigate: NavigateFn
}

export function UsersTable({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  error,
  search,
  navigate
}: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { data: rolesPage } = useRoleOptionsQuery()
  const roleFilterOptions = useMemo(
    () => (rolesPage?.items ?? []).map((role) => ({ label: role.name, value: role.code })),
    [rolesPage?.items]
  )
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
      { columnId: 'roles', searchKey: 'role', type: 'array' }
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
        row.original.realName,
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

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      toolbar={
        <DataTableToolbar
          table={table}
          searchPlaceholder="搜索用户名、姓名、邮箱、手机号"
          searchValue={globalFilter ?? undefined}
          onSearchChange={handleSearchChange}
          filters={[
            {
              columnId: 'status',
              title: '状态',
              options: toOptions(statusConfig)
            },
            {
              columnId: 'roles',
              title: '角色',
              options: roleFilterOptions
            }
          ]}
        />
      }
      footer={
        <UsersBulkActions
          selectedItems={table.getFilteredSelectedRowModel().rows.map((row) => row.original)}
          onClearSelection={() => table.resetRowSelection()}
        />
      }
    />
  )
}
