import { useMutation } from '@tanstack/react-query'
import { isAuthMfaChallenge } from '@zen/shared'

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
    }
  })
}

export function useVerifyMfaMutation() {
  return useMutation({
    mutationKey: ['auth', 'mfa-verify'],
    mutationFn: ({ mfaToken, code }: { mfaToken: string; code: string }) =>
      authApi.verifyMfa(mfaToken, code),
    onSuccess: persistAuthSession
  })
}

export function useSignUpMutation() {
  return useMutation({
    mutationKey: ['auth', 'sign-up'],
    mutationFn: authApi.signUp,
    onSuccess: persistAuthSession
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
