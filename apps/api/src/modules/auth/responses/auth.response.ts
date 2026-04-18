import type { UserInfoResponse } from '@/modules/user/responses/user.response'

export interface AuthSessionUserResponse {
  id: string
  username: string
  email: string
  nickname?: string | null
  phone?: string | null
}

export interface AuthSessionResponse {
  accessToken: string
  user: AuthSessionUserResponse
  userInfo: UserInfoResponse
}

export type LoginResponse = AuthSessionResponse

export type RegisterResponse = AuthSessionResponse

export type RefreshResponse = AuthSessionResponse
