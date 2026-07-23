import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sessionsApi } from './api'

export const sessionKeys = {
  all: ['sessions'] as const,
  list: () => [...sessionKeys.all, 'list'] as const
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: async () => {
      const result = await sessionsApi.listSessions()
      return result.items
    }
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sessionsApi.revokeSession(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success('会话已下线')
    },
    onError: (error: Error) => toast.error(error.message || '下线失败')
  })
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => sessionsApi.revokeAllSessions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      toast.success('已强制下线全部会话')
    },
    onError: (error: Error) => toast.error(error.message || '操作失败')
  })
}
