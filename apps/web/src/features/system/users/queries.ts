import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { request } from '@/lib/request'

import { userApi } from './api'

import type { Role, UsersQuery } from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

export const usersQueryKeys = {
  all: ['system', 'users'] as const,
  list: (params: UsersQuery) => [...usersQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...usersQueryKeys.all, 'detail', id] as const
}

export function useUsersQuery(params: UsersQuery = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: usersQueryKeys.list(params),
    queryFn: () => userApi.getUserList(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true
  })
}

export function useUserQuery(userId: string) {
  return useQuery({
    queryKey: usersQueryKeys.detail(userId),
    queryFn: () => userApi.getUser(userId),
    enabled: Boolean(userId)
  })
}

export function useRoleOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: ['system', 'roles', 'options'],
    queryFn: () =>
      request.get<PaginationResponse<Role>>('/role', {
        params: { page: 1, pageSize: 100, status: 'active' }
      }),
    enabled,
    staleTime: 60_000
  })
}
