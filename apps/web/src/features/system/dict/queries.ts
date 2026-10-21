import { queryOptions, useQuery } from '@tanstack/react-query'

import { dictApi } from './api'

import type { DictListParams } from './api'

export const dictKeys = {
  all: ['dictionary'] as const,
  workspaces: () => [...dictKeys.all, 'workspaces'] as const,
  list: (params?: DictListParams) => [...dictKeys.all, 'list', params] as const,
  detail: (id: string) => [...dictKeys.all, 'detail', id] as const
}

export const workspacesQueryOptions = () =>
  queryOptions({
    queryKey: dictKeys.workspaces(),
    queryFn: () => dictApi.getWorkspaces()
  })

export const dictionaryListQueryOptions = (params?: DictListParams) =>
  queryOptions({
    queryKey: dictKeys.list(params),
    queryFn: () => dictApi.getDictionaryList(params)
  })

export const dictionaryDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: dictKeys.detail(id),
    queryFn: () => dictApi.getDictionaryDetail(id),
    enabled: Boolean(id)
  })

export function useWorkspacesQuery() {
  return useQuery(workspacesQueryOptions())
}

export function useDictionaryListQuery(params?: DictListParams) {
  return useQuery(dictionaryListQueryOptions(params))
}

export function useDictionaryDetailQuery(id: string) {
  return useQuery(dictionaryDetailQueryOptions(id))
}
