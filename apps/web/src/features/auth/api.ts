import { request } from '@/lib/request'

export interface SignInData {
  identifier: string
  password: string
}

export interface SignUpData {
  username: string
  email: string
  password: string
}

export interface AuthSessionUser {
  id: string
  username: string
  email: string
  nickname: string | null
  phone: string | null
}

export interface AuthSessionResponse {
  accessToken: string
  refreshToken: string
  user: AuthSessionUser
  userInfo: unknown
}

export const authApi = {
  signIn: (data: SignInData) => request.post<AuthSessionResponse, SignInData>('/auth/login', data),
  signUp: (data: SignUpData) =>
    request.post<AuthSessionResponse, SignUpData>('/auth/register', data)
}
