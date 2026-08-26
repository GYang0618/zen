import type { InfiniteData } from '@tanstack/react-query'
import type { PaginationResponse } from '@/lib/request'

export const CARD_PAGE_SIZE = 12

export function getNextPageParam(lastPage: PaginationResponse<unknown>): number | undefined {
  const { page, totalPages } = lastPage.pagination
  return page < totalPages ? page + 1 : undefined
}

export function flattenPages<T>(data: InfiniteData<PaginationResponse<T>> | undefined): T[] {
  return data?.pages.flatMap((page) => page.items) ?? []
}

export function mapInfinitePageItems<T>(
  current: InfiniteData<PaginationResponse<T>> | undefined,
  mapItem: (item: T) => T
): InfiniteData<PaginationResponse<T>> | undefined {
  if (!current) return current
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.map(mapItem)
    }))
  }
}
