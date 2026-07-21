import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { roleApi } from './api'

import type { RolesQuery } from '@zen/shared'

const ROLES_LIST_QUERY_KEY = ['system', 'roles', 'list'] as const
const PERMISSIONS_QUERY_KEY = ['system', 'roles', 'permissions'] as const

export function useRolesQuery(params: RolesQuery = {}) {
  return useQuery({
    queryKey: [...ROLES_LIST_QUERY_KEY, params],
    queryFn: () => roleApi.getRoleList(params),
    placeholderData: keepPreviousData
  })
}

export function usePermissionsQuery(enabled = true) {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEY,
    queryFn: () => roleApi.getPermissions(),
    enabled,
    staleTime: 5 * 60 * 1000
  })
}

export { ROLES_LIST_QUERY_KEY }
