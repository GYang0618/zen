import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roleApi } from './api'
import { ROLES_LIST_QUERY_KEY } from './queries'

export function useCreateRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'create'],
    mutationFn: roleApi.createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROLES_LIST_QUERY_KEY })
    }
  })
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'update'],
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof roleApi.updateRole>[1] }) =>
      roleApi.updateRole(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROLES_LIST_QUERY_KEY })
    }
  })
}

export function useDeleteRolesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'delete'],
    mutationFn: (ids: string[]) => roleApi.deleteRoles({ ids }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROLES_LIST_QUERY_KEY })
    }
  })
}
