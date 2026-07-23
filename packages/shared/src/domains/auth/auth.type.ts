import type { User } from '../user'

export type AuthSessionUser = Pick<
  User,
  'id' | 'username' | 'nickname' | 'phoneNumber' | 'email' | 'role' | 'permissions' | 'avatar'
>

export type AuthSession = {
  accessToken: string
  /** 登录后需强制改密（首次 / 管理员重置 / 密码过期） */
  mustChangePassword?: boolean
  user: AuthSessionUser
}

/** 登录需 MFA 时的挑战响应 */
export type AuthMfaChallenge = {
  requiresMfa: true
  mfaToken: string
}

export type AuthLoginResult = AuthSession | AuthMfaChallenge

export function isAuthMfaChallenge(value: AuthLoginResult): value is AuthMfaChallenge {
  return 'requiresMfa' in value && value.requiresMfa === true
}
