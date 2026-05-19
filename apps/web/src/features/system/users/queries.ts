import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { userApi } from './api'

import type { UsersQuery } from '@zen/shared'

export function useUsersQuery(params: UsersQuery = {}) {
  return useQuery({
    queryKey: ['system', 'users', 'list', params],
    queryFn: () => userApi.getUserList(params),
    placeholderData: keepPreviousData
  })
}
