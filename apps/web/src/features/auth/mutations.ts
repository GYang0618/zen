import { useMutation } from '@tanstack/react-query'
import { isAuthMfaChallenge } from '@zen/shared'
import { toast } from '@zen/ui'

import { useAuthStore } from '@/stores'

import { authApi } from './api'

import type { AuthLoginResult, AuthSession } from '@zen/shared'
import type { SignInData } from './api'

export type { SignInData }

const persistAuthSession = (session: AuthSession) => {
  useAuthStore.getState().setAuth(session)
}

export function useSignInMutation() {
  return useMutation({
    mutationKey: ['auth', 'sign-in'],
    mutationFn: async (data: SignInData): Promise<AuthLoginResult> => authApi.signIn(data),
    onSuccess: (result) => {
      if (!isAuthMfaChallenge(result)) {
        persistAuthSession(result)
      }
    },
    onError: (error: Error) => {
      toast.add({ title: error.message || '登录失败', type: 'error' })
    }
  })
}

export function useVerifyMfaMutation() {
  return useMutation({
    mutationKey: ['auth', 'mfa-verify'],
    mutationFn: ({ mfaToken, code }: { mfaToken: string; code: string }) =>
      authApi.verifyMfa(mfaToken, code),
    onSuccess: persistAuthSession,
    onError: (error: Error) => {
      toast.add({ title: error.message || '验证失败', type: 'error' })
    }
  })
}

export function useSignUpMutation() {
  return useMutation({
    mutationKey: ['auth', 'sign-up'],
    mutationFn: authApi.signUp,
    onSuccess: persistAuthSession,
    onError: (error: Error) => {
      toast.add({ title: error.message || '注册失败', type: 'error' })
    }
  })
}

export function useRefreshSessionMutation() {
  return useMutation({
    mutationKey: ['auth', 'refresh'],
    mutationFn: authApi.refresh,
    onSuccess: persistAuthSession
  })
}

export function useSignOutMutation() {
  return useMutation({
    mutationKey: ['auth', 'sign-out'],
    mutationFn: authApi.signOut,
    onSuccess: () => {
      useAuthStore.getState().clearAuth()
    },
    onError: () => {
      useAuthStore.getState().clearAuth()
    }
  })
}
