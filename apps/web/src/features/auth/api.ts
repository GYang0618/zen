import { request } from '@/lib/request'

import type { AuthSession } from '@zen/shared'

export interface SignInData {
  identifier: string
  password: string
}

export interface SignUpData {
  username: string
  email: string
  password: string
}

export const authApi = {
  signIn: (data: SignInData) => request.post<AuthSession, SignInData>('/auth/login', data),
  signUp: (data: SignUpData) => request.post<AuthSession, SignUpData>('/auth/register', data),
  refresh: () => request.post<AuthSession, void>('/auth/refresh'),
  signOut: () => request.post<void, void>('/auth/logout')
}
