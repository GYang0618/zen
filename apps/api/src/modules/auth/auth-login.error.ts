import { HttpException, HttpStatus } from '@nestjs/common'

/** 登录失败的机器可读原因，写入错误响应的 `reason`。 */
export const AuthLoginReason = {
  UserNotFound: 'AUTH_USER_NOT_FOUND',
  InvalidPassword: 'AUTH_INVALID_PASSWORD',
  AccountLocked: 'AUTH_ACCOUNT_LOCKED',
  AccountSuspended: 'AUTH_ACCOUNT_SUSPENDED',
  AccountInactive: 'AUTH_ACCOUNT_INACTIVE',
  AccountPending: 'AUTH_ACCOUNT_PENDING'
} as const

export type AuthLoginReason = (typeof AuthLoginReason)[keyof typeof AuthLoginReason]

const STATUS_BY_REASON: Record<AuthLoginReason, HttpStatus> = {
  [AuthLoginReason.UserNotFound]: HttpStatus.NOT_FOUND,
  [AuthLoginReason.InvalidPassword]: HttpStatus.UNAUTHORIZED,
  [AuthLoginReason.AccountLocked]: HttpStatus.LOCKED,
  [AuthLoginReason.AccountSuspended]: HttpStatus.FORBIDDEN,
  [AuthLoginReason.AccountInactive]: HttpStatus.FORBIDDEN,
  [AuthLoginReason.AccountPending]: HttpStatus.FORBIDDEN
}

export function throwAuthLoginError(reason: AuthLoginReason, message: string): never {
  throw new HttpException({ message, reason }, STATUS_BY_REASON[reason])
}

export function readAuthFailureReason(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse()
    if (isRecord(response) && typeof response.reason === 'string' && response.reason.trim()) {
      return response.reason
    }
  }
  return error instanceof Error ? error.message : 'login_failed'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
