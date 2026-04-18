import { useMutation } from '@tanstack/react-query'

import { useAuthStore } from '@/stores'

import { authApi } from './api'

import type { AuthSessionResponse } from './api'

const persistAuthSession = (session: AuthSessionResponse) => {
  useAuthStore.getState().setAuth(session.accessToken, session.user)
}

export function useSignInMutation() {
  return useMutation({
    mutationKey: ['auth', 'sign-in'],
    mutationFn: authApi.signIn,
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
