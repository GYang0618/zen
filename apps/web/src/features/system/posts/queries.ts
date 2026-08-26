import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { toast } from 'sonner'

import { CARD_PAGE_SIZE, getNextPageParam } from '@/lib/infinite-list'

import { postApi } from './api'

import type { CreateJobProfile, FindJobProfilesQuery, UpdateJobProfile } from '@zen/shared'

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (query?: FindJobProfilesQuery) => [...postKeys.lists(), query] as const,
  infinite: (query?: Omit<FindJobProfilesQuery, 'page' | 'pageSize'>) =>
    [...postKeys.all, 'infinite', query] as const
}

type JobProfileListFilters = Omit<FindJobProfilesQuery, 'page' | 'pageSize'>

export function useJobProfilesQuery(query?: FindJobProfilesQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: postKeys.list(query),
    queryFn: () => postApi.getList(query),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true
  })
}

export function useJobProfilesInfiniteQuery(query: JobProfileListFilters = {}) {
  return useInfiniteQuery({
    queryKey: postKeys.infinite(query),
    queryFn: ({ pageParam }) =>
      postApi.getList({ ...query, page: pageParam, pageSize: CARD_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam,
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
