import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/stores'

import type { UpdateMyProfile } from '@zen/shared'

export const settingsKeys = {
  all: ['settings'] as const,
  me: () => [...settingsKeys.all, 'me'] as const,
  sessions: () => [...settingsKeys.all, 'sessions'] as const
}

export function useMeQuery() {
  return useQuery({
    queryKey: settingsKeys.me(),
    queryFn: () => authApi.getMe()
  })
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)
  const accessToken = useAuthStore((state) => state.accessToken)
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)
  const currentUser = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: (data: UpdateMyProfile) => authApi.updateMe(data),
    onSuccess: (me) => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.me() })
      if (accessToken && currentUser) {
        setAuth({
          accessToken,
          mustChangePassword,
          user: {
            ...currentUser,
            nickname: me.profile.nickname,
            phoneNumber: me.contact.phoneNumber,
            avatar: me.profile.avatar,
            email: me.contact.email,
            username: me.profile.username
          }
        })
      }
      toast.success('已保存')
    },
    onError: (error: Error) => toast.error(error.message || '保存失败')
  })
}

export function useSettingsSessionsQuery() {
  return useQuery({
    queryKey: settingsKeys.sessions(),
    queryFn: async () => {
      const result = await authApi.listSessions()
      return result.items
    }
  })
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => authApi.revokeSession(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.sessions() })
      toast.success('会话已下线')
    },
    onError: (error: Error) => toast.error(error.message || '下线失败')
  })
}

export function useRevokeOtherSessionsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.revokeOtherSessions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.sessions() })
      toast.success('已下线其他设备')
    },
    onError: (error: Error) => toast.error(error.message || '操作失败')
  })
}
