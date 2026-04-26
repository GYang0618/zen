import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { userApi } from './api'
import type { UsersSortBy, UsersSortOrder } from './types'

interface UseUsersQueryParams {
  keyword?: string
  page?: number
  pageSize?: number
  status?: string[]
  role?: string[]
  sortBy?: UsersSortBy
  sortOrder?: UsersSortOrder
}

export function useUsersQuery(params: UseUsersQueryParams = {}) {
  return useQuery({
    queryKey: ['system', 'users', 'list', params],
    queryFn: () => userApi.getUserList(params),
    placeholderData: keepPreviousData
  })
}
