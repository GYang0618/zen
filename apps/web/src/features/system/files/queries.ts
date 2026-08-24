import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { storageApi } from './api'

import type { FileDisposition, FileListQuery } from '@zen/shared'

export const filesQueryKeys = {
  all: ['system', 'files'] as const,
  list: (params: FileListQuery) => [...filesQueryKeys.all, 'list', params] as const,
  url: (id: string, disposition: FileDisposition) =>
    [...filesQueryKeys.all, 'url', id, disposition] as const
}

export function useFilesQuery(params: FileListQuery = {}) {
  return useQuery({
    queryKey: filesQueryKeys.list(params),
    queryFn: () => storageApi.list(params),
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
