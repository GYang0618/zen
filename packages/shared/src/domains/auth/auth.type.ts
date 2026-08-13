export type AuthSessionUser = {
  id: string
  username: string
  nickname: string | null
  phoneNumber: string | null
  email: string
  /** 主角色编码，兼容会话载荷 */
  role: string | null
  permissions: string[]
  avatar: string | null
}

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
