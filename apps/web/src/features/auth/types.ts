export interface AuthSessionUser {
  id: string
  username: string
  email: string
  nickname: string | null
  phone: string | null
}

export interface AuthSession {
  accessToken: string
  user: AuthSessionUser
}
