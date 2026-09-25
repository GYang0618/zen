import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@zen/ui'

import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/stores'

import type { UpdateMyProfile } from '@zen/shared'
import type { MeResponse } from '@/features/auth/api'

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

export function useApplyMeSession() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)
  const accessToken = useAuthStore((state) => state.accessToken)
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)
  const currentUser = useAuthStore((state) => state.user)

  return (me: MeResponse) => {
    queryClient.setQueryData(settingsV2Keys.me(), me)
    if (!accessToken || !currentUser) return
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
}

export function useUpdateMeMutation() {
  const applyMeSession = useApplyMeSession()

  return useMutation({
    mutationFn: (data: UpdateMyProfile) => authApi.updateMe(data),
    onSuccess: (me) => {
      applyMeSession(me)
    },
    onError: (error: Error) => toast.add({ title: error.message || '保存失败', type: 'error' })
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(payload),
    onSuccess: () => toast.add({ title: '密码已更新', type: 'success' }),
    onError: (error: Error) => toast.add({ title: error.message || '密码更新失败', type: 'error' })
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
      toast.add({ title: '双重验证已启用', type: 'success' })
    },
    onError: (error: Error) => toast.add({ title: error.message || '启用失败', type: 'error' })
  })
}

export function useDisableMfaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => authApi.disableMfa(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsV2Keys.me() })
      toast.add({ title: '双重验证已关闭', type: 'success' })
    },
    onError: (error: Error) => toast.add({ title: error.message || '关闭失败', type: 'error' })
  })
}
