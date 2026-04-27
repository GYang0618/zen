import { useQuery } from '@tanstack/react-query'

import { userApi } from './api'

export function useUsersQuery() {
  return useQuery({
    queryKey: ['system', 'users', 'list'],
    queryFn: () => userApi.getUserList()
  })
}
