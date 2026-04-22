export interface AuthSessionUserResponse {
  id: string
  username: string
  email: string
  nickname: string | null
  avatar: string | null
  roles: string[]
  permissions: string[]
}

export interface AuthSessionResponse {
  accessToken: string
  user: AuthSessionUserResponse
}

export type LoginResponse = AuthSessionResponse

export type RegisterResponse = AuthSessionResponse

export type RefreshResponse = AuthSessionResponse
