import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userApi } from './api'

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['system', 'users', 'create'],
    mutationFn: userApi.createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['system', 'users', 'list'] })
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
      await queryClient.invalidateQueries({ queryKey: ['system', 'users', 'list'] })
    }
  })
}
