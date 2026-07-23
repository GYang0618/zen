import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { clearActivePluginIdsCache, pluginsApi } from './api'

export const pluginKeys = {
  all: ['plugins'] as const,
  list: () => [...pluginKeys.all, 'list'] as const
}

export function usePluginsQuery() {
  return useQuery({
    queryKey: pluginKeys.list(),
    queryFn: async () => {
      const result = await pluginsApi.list()
      return result.items
    }
  })
}

export function useActivatePlugin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pluginsApi.activate(id),
    onSuccess: async () => {
      clearActivePluginIdsCache()
      await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
      toast.success('插件已启用')
    },
    onError: (error: Error) => toast.error(error.message || '启用失败')
  })
}

export function useDeactivatePlugin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pluginsApi.deactivate(id),
    onSuccess: async () => {
      clearActivePluginIdsCache()
      await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
      toast.success('插件已停用')
    },
    onError: (error: Error) => toast.error(error.message || '停用失败')
  })
}

export function useUpdatePluginConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: Record<string, unknown> }) =>
      pluginsApi.updateConfig(id, config),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
      toast.success('插件配置已保存')
    },
    onError: (error: Error) => toast.error(error.message || '保存失败')
  })
}
