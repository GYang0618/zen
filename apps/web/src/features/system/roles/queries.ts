import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { roleApi } from './api'

import type { RolesQuery } from '@zen/shared'

const ROLES_LIST_QUERY_KEY = ['system', 'roles', 'list'] as const
const PERMISSIONS_QUERY_KEY = ['system', 'roles', 'permissions'] as const
const ROLE_MEMBERS_QUERY_KEY = ['system', 'roles', 'members'] as const

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

export function useRoleMembersQuery(roleId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...ROLE_MEMBERS_QUERY_KEY, roleId],
    queryFn: () => roleApi.getRoleMembers(roleId!, { page: 1, pageSize: 100 }),
    enabled: Boolean(roleId) && enabled,
    placeholderData: keepPreviousData
  })
}

export { ROLE_MEMBERS_QUERY_KEY, ROLES_LIST_QUERY_KEY }
