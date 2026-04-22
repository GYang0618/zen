import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { userApi } from './api'

interface UseUsersQueryParams {
  keyword?: string
  page?: number
  pageSize?: number
  status?: string[]
  role?: string[]
}

export function useUsersQuery(params: UseUsersQueryParams = {}) {
  return useQuery({
    queryKey: ['system', 'users', 'list', params],
    queryFn: () => userApi.getUserList(params),
    placeholderData: keepPreviousData
  })
}
