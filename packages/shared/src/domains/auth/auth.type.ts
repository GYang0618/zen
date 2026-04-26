import type { User } from '../user'

export type AuthSessionUser = Pick<
  User,
  'id' | 'username' | 'nickname' | 'phoneNumber' | 'email' | 'role' | 'permissions' | 'avatar'
>

export type AuthSession = {
  accessToken: string
  user: AuthSessionUser
}
