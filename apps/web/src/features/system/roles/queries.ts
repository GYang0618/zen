import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { roleApi } from './api'

interface UseRolesQueryParams {
  keyword?: string
  page?: number
  pageSize?: number
  status?: string[]
  dataScope?: string[]
}

export function useRolesQuery(params: UseRolesQueryParams = {}) {
  return useQuery({
    queryKey: ['system', 'roles', 'list', params],
    queryFn: () => roleApi.getRoleList(params),
    placeholderData: keepPreviousData
  })
}
