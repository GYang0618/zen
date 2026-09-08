import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { CARD_PAGE_SIZE, getNextPageParam } from '@/lib/infinite-list'

import { storageApi } from './api'

import type { FileDisposition, FileListQuery } from '@zen/shared'

export const filesQueryKeys = {
  all: ['system', 'files'] as const,
  list: (params: FileListQuery) => [...filesQueryKeys.all, 'list', params] as const,
  infinite: (params: FilesListFilters) => [...filesQueryKeys.all, 'infinite', params] as const,
  url: (id: string, disposition: FileDisposition) =>
    [...filesQueryKeys.all, 'url', id, disposition] as const
}

type FilesListFilters = Omit<FileListQuery, 'page' | 'pageSize'>

export function useFilesQuery(params: FileListQuery = {}) {
  return useQuery({
    queryKey: filesQueryKeys.list(params),
    queryFn: () => storageApi.list(params),
    placeholderData: keepPreviousData
  })
}

export function useFilesInfiniteQuery(params: FilesListFilters = {}) {
  return useInfiniteQuery({
    queryKey: filesQueryKeys.infinite(params),
    queryFn: ({ pageParam }) =>
      storageApi.list({ ...params, page: pageParam, pageSize: CARD_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    placeholderData: keepPreviousData
  })
}

export function useFileUrlQuery(
  id: string | undefined,
  disposition: FileDisposition,
  enabled = true
) {
  return useQuery({
    queryKey: id ? filesQueryKeys.url(id, disposition) : [...filesQueryKeys.all, 'url', 'none'],
    queryFn: () => storageApi.getUrl(id!, disposition),
    enabled: Boolean(id) && enabled,
    staleTime: 60_000
  })
}
