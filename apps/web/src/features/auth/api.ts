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

export interface AuthSessionItem {
  id: string
  ip: string | null
  userAgent: string | null
  expiresAt: string
  createdAt: string
}

export const authApi = {
  signIn: (data: SignInData) =>
    request.post<AuthSession | { requiresMfa: true; mfaToken: string }, SignInData>(
      '/auth/login',
      data
    ),
  verifyMfa: (mfaToken: string, code: string) =>
    request.post<AuthSession, { mfaToken: string; code: string }>('/auth/mfa/verify', {
      mfaToken,
      code
    }),
  setupMfa: () => request.post<{ secret: string; otpauthUrl: string }>('/auth/mfa/setup'),
  enableMfa: (code: string) => request.post<void, { code: string }>('/auth/mfa/enable', { code }),
  disableMfa: (code: string) => request.post<void, { code: string }>('/auth/mfa/disable', { code }),
  stepUp: (payload: { password?: string; mfaCode?: string }) =>
    request.post<{ stepUpToken: string }, { password?: string; mfaCode?: string }>(
      '/auth/step-up',
      payload
    ),
  signUp: (data: SignUpData) => request.post<AuthSession, SignUpData>('/auth/register', data),
  refresh: () => request.post<AuthSession, void>('/auth/refresh'),
  signOut: () => request.post<void, void>('/auth/logout'),
  listSessions: () => request.get<{ items: AuthSessionItem[] }>('/auth/sessions'),
  revokeSession: (id: string) => request.delete<void>(`/auth/sessions/${id}`),
  revokeAllSessions: () => request.delete<void>('/auth/sessions'),
  forgotPassword: (email: string) =>
    request.post<{ ok: true; resetToken?: string }, { email: string }>('/auth/forgot-password', {
      email
    }),
  resetPassword: (token: string, password: string) =>
    request.post<void, { token: string; password: string }>('/auth/reset-password', {
      token,
      password
    }),
  changePassword: (payload: { currentPassword?: string; newPassword: string }) =>
    request.post<void, { currentPassword?: string; newPassword: string }>(
      '/auth/change-password',
      payload
    )
}
