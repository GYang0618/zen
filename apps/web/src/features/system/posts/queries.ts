import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { postApi } from './api'

import type { CreateJobProfile, FindJobProfilesQuery, UpdateJobProfile } from '@zen/shared'

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (query?: FindJobProfilesQuery) => [...postKeys.lists(), query] as const
}

export function useJobProfilesQuery(query?: FindJobProfilesQuery) {
  return useQuery({
    queryKey: postKeys.list(query),
    queryFn: () => postApi.getList(query),
    placeholderData: keepPreviousData
  })
}

export function useCreateJobProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateJobProfile) => postApi.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postKeys.all })
      toast.success('岗位已创建')
    },
    onError: (error: Error) => toast.error(error.message || '创建失败')
  })
}

export function useUpdateJobProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobProfile }) => postApi.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postKeys.all })
      toast.success('岗位已更新')
    },
    onError: (error: Error) => toast.error(error.message || '更新失败')
  })
}

export function useDisableJobProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => postApi.disable(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postKeys.all })
      toast.success('岗位已停用')
    },
    onError: (error: Error) => toast.error(error.message || '停用失败')
  })
}

export function useDeleteJobProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => postApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: postKeys.all })
      toast.success('岗位已删除')
    },
    onError: (error: Error) => toast.error(error.message || '删除失败')
  })
}
