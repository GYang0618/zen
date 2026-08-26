import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { CARD_PAGE_SIZE, getNextPageParam } from '@/lib/infinite-list'
import { request } from '@/lib/request'

import { userApi } from './api'

import type { Role, UsersQuery } from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

type UsersListFilters = Omit<UsersQuery, 'page' | 'pageSize'>

export const usersQueryKeys = {
  all: ['system', 'users'] as const,
  list: (params: UsersQuery) => [...usersQueryKeys.all, 'list', params] as const,
  infinite: (params: UsersListFilters) => [...usersQueryKeys.all, 'infinite', params] as const,
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

export function useUsersInfiniteQuery(params: UsersListFilters = {}) {
  return useInfiniteQuery({
    queryKey: usersQueryKeys.infinite(params),
    queryFn: ({ pageParam }) =>
      userApi.getUserList({ ...params, page: pageParam, pageSize: CARD_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
    placeholderData: keepPreviousData
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
