export interface AuthSessionUser {
  id: string
  username: string
  email: string
  nickname: string | null
  avatar: string | null
  roles: string[]
  permissions: string[]
}

export interface AuthSession {
  accessToken: string
  user: AuthSessionUser
}
