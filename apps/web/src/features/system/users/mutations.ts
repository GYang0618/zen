import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userApi } from './api'

const USERS_LIST_QUERY_KEY = ['system', 'users', 'list'] as const

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_LIST_QUERY_KEY })
    }
  })
}

export function useDeleteUsersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'delete'],
    mutationFn: userApi.deleteUsers,
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
