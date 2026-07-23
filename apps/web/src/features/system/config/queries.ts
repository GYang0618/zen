import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { configApi } from './api'

import type { SiteConfig } from '@zen/shared'

export const configKeys = {
  all: ['system-config'] as const,
  detail: () => [...configKeys.all, 'detail'] as const
}

export function useSiteConfig() {
  return useQuery({
    queryKey: configKeys.detail(),
    queryFn: () => configApi.get()
  })
}

export function useUpdateSiteConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<SiteConfig>) => configApi.update(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: configKeys.all })
      toast.success('站点配置已保存')
    },
    onError: (error: Error) => toast.error(error.message || '保存失败')
  })
}
