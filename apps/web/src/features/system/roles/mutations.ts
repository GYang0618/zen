import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roleApi } from './api'
import { ROLE_MEMBERS_QUERY_KEY, ROLES_LIST_QUERY_KEY } from './queries'

import type { AssignRoleMembers, CloneRole } from '@zen/shared'

async function invalidateRoleQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  roleId?: string
) {
  const tasks = [queryClient.invalidateQueries({ queryKey: ROLES_LIST_QUERY_KEY })]
  if (roleId) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: [...ROLE_MEMBERS_QUERY_KEY, roleId] }),
      queryClient.invalidateQueries({ queryKey: ['system', 'users', 'list'] })
    )
  }
  await Promise.all(tasks)
}

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

export function useCloneRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'clone'],
    mutationFn: ({ id, data }: { id: string; data: CloneRole }) => roleApi.cloneRole(id, data),
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
    onSuccess: async (_data, variables) => {
      await invalidateRoleQueries(queryClient, variables.id)
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

export function useAddRoleMembersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'members', 'add'],
    mutationFn: ({ id, data }: { id: string; data: AssignRoleMembers }) =>
      roleApi.addRoleMembers(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateRoleQueries(queryClient, variables.id)
    }
  })
}

export function useRemoveRoleMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'roles', 'members', 'remove'],
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      roleApi.removeRoleMember(id, userId),
    onSuccess: async (_data, variables) => {
      await invalidateRoleQueries(queryClient, variables.id)
    }
  })
}
