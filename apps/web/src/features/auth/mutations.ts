import { useMutation } from '@tanstack/react-query'

import { authApi } from './api'

import type { AuthSessionResponse } from './api'

const ACCESS_TOKEN_STORAGE_KEY = 'token'
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken'
const AUTH_USER_STORAGE_KEY = 'authUser'

function persistAuthSession(session: AuthSessionResponse) {
  console.log('🚀 ~ persistAuthSession ~ session:', session)

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken)
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refreshToken)
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user))
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
