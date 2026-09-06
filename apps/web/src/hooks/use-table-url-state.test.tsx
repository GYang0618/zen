// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useTableUrlState } from './use-table-url-state'

afterEach(cleanup)

describe('useTableUrlState', () => {
  it('从 search 恢复分页、过滤，并在变更时写回 URL', () => {
    const navigate = vi.fn()
    const { result } = renderHook(() =>
      useTableUrlState({
        search: { page: 2, pageSize: 20, keyword: 'alice', status: ['ACTIVE'] },
        navigate,
        pagination: { defaultPage: 1, defaultPageSize: 10 },
        globalFilter: { enabled: true, key: 'keyword', trim: true },
        columnFilters: [{ columnId: 'status', searchKey: 'status', type: 'array' }]
      })
    )

    expect(result.current.pagination).toEqual({ pageIndex: 1, pageSize: 20 })
    expect(result.current.globalFilter).toBe('alice')
    expect(result.current.columnFilters).toEqual([{ id: 'status', value: ['ACTIVE'] }])

    result.current.onPaginationChange({ pageIndex: 2, pageSize: 20 })
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.any(Function)
      })
    )
    const searchUpdater = navigate.mock.calls[0]?.[0]?.search as (
      prev: Record<string, unknown>
    ) => Record<string, unknown>
    expect(searchUpdater({ keyword: 'alice' })).toEqual({
      keyword: 'alice',
      page: 3,
      pageSize: 20
    })
  })
})
