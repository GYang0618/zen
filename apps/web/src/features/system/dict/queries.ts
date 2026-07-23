import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { dictApi } from './api'

import type { CreateDictItem, CreateDictType } from '@zen/shared'

export const dictKeys = {
  all: ['dict'] as const,
  list: () => [...dictKeys.all, 'list'] as const
}

export function useDictList() {
  return useQuery({
    queryKey: dictKeys.list(),
    queryFn: () => dictApi.list()
  })
}

export function useCreateDictType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDictType) => dictApi.createType(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dictKeys.all })
      toast.success('字典类型已创建')
    },
    onError: (error: Error) => toast.error(error.message || '创建失败')
  })
}

export function useCreateDictItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDictItem) => dictApi.createItem(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dictKeys.all })
      toast.success('字典项已创建')
    },
    onError: (error: Error) => toast.error(error.message || '创建失败')
  })
}
