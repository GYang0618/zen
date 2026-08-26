import { describe, expect, it } from 'vitest'

import { flattenPages, getNextPageParam, mapInfinitePageItems } from './infinite-list'

import type { InfiniteData } from '@tanstack/react-query'
import type { PaginationResponse } from '@/lib/request'

function page(items: number[], current: number, totalPages: number): PaginationResponse<number> {
  return {
    items,
    pagination: { page: current, pageSize: 12, total: 24, totalPages }
  }
}

describe('getNextPageParam', () => {
  it('returns the next page when more pages remain', () => {
    expect(getNextPageParam(page([1], 1, 3))).toBe(2)
  })

  it('returns undefined on the last page', () => {
    expect(getNextPageParam(page([1], 3, 3))).toBeUndefined()
  })

  it('returns undefined when the list is empty', () => {
    expect(
      getNextPageParam({
        items: [],
        pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 }
      })
    ).toBeUndefined()
  })
})

describe('flattenPages', () => {
  it('concatenates items across loaded pages', () => {
    const data: InfiniteData<PaginationResponse<number>> = {
      pageParams: [1, 2],
      pages: [page([1, 2], 1, 2), page([3, 4], 2, 2)]
    }
    expect(flattenPages(data)).toEqual([1, 2, 3, 4])
  })

  it('returns an empty list when no pages have loaded', () => {
    expect(flattenPages(undefined)).toEqual([])
  })
})

describe('mapInfinitePageItems', () => {
  it('maps items in every loaded page', () => {
    const data: InfiniteData<PaginationResponse<number>> = {
      pageParams: [1],
      pages: [page([1, 2], 1, 1)]
    }
    expect(mapInfinitePageItems(data, (item) => item * 2)?.pages[0]?.items).toEqual([2, 4])
  })
})
