import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/stores'

import type { UpdateMyProfile } from '@zen/shared'

export const settingsV2Keys = {
  all: ['settings-v2'] as const,
  me: () => [...settingsV2Keys.all, 'me'] as const
}

export function useMeQuery() {
  return useQuery({
    queryKey: settingsV2Keys.me(),
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
      void queryClient.invalidateQueries({ queryKey: settingsV2Keys.me() })
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

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(payload),
    onSuccess: () => toast.success('密码已更新'),
    onError: (error: Error) => toast.error(error.message || '密码更新失败')
  })
}

export function useSetupMfaMutation() {
  return useMutation({
    mutationFn: () => authApi.setupMfa()
  })
}

export function useEnableMfaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => authApi.enableMfa(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsV2Keys.me() })
      toast.success('双重验证已启用')
    },
    onError: (error: Error) => toast.error(error.message || '启用失败')
  })
}

export function useDisableMfaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => authApi.disableMfa(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsV2Keys.me() })
      toast.success('双重验证已关闭')
    },
    onError: (error: Error) => toast.error(error.message || '关闭失败')
  })
}
