import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userApi } from './api'

const USERS_LIST_QUERY_KEY = ['system', 'users', 'list'] as const

function invalidateUserQueries(queryClient: ReturnType<typeof useQueryClient>, userId?: string) {
  const tasks = [queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY })]
  if (userId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: ['system', 'users', 'detail', userId] }))
  }
  return Promise.all(tasks)
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'create'],
    mutationFn: userApi.createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY })
    }
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'update'],
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof userApi.updateUser>[1] }) =>
      userApi.updateUser(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateUserQueries(queryClient, variables.id)
    }
  })
}

export function useDeleteUsersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'delete'],
    mutationFn: ({ ids, stepUpToken }: { ids: string[]; stepUpToken: string }) =>
      userApi.deleteUsers(ids, stepUpToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY })
    }
  })
}

export function useUpdateUsersStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'status'],
    mutationFn: userApi.updateUsersStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY })
    }
  })
}

export function useUnlockUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'unlock'],
    mutationFn: (id: string) => userApi.unlock(id),
    onSuccess: async (_data, id) => {
      await invalidateUserQueries(queryClient, id)
    }
  })
}

export function useAdminResetPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'reset-password'],
    mutationFn: ({
      id,
      password,
      mustChangePassword
    }: {
      id: string
      password: string
      mustChangePassword?: boolean
    }) => userApi.adminResetPassword(id, { password, mustChangePassword }),
    onSuccess: async (_data, variables) => {
      await invalidateUserQueries(queryClient, variables.id)
    }
  })
}

export function useAssignUserRolesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'assign-roles'],
    mutationFn: ({
      id,
      roleIds,
      stepUpToken
    }: {
      id: string
      roleIds: string[]
      stepUpToken: string
    }) => userApi.assignRoles(id, { roleIds }, stepUpToken),
    onSuccess: async (_data, variables) => {
      await invalidateUserQueries(queryClient, variables.id)
    }
  })
}

export function useReplaceUserOrganizationsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'replace-organizations'],
    mutationFn: ({
      id,
      organizations
    }: {
      id: string
      organizations: Parameters<typeof userApi.replaceOrganizations>[1]['organizations']
    }) => userApi.replaceOrganizations(id, { organizations }),
    onSuccess: async (_data, variables) => {
      await invalidateUserQueries(queryClient, variables.id)
    }
  })
}
