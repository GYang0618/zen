import { describe, expect, it } from 'vitest'

import { isAuthRecoveryExcludedRequestUrl } from './auth-paths'

describe('isAuthRecoveryExcludedRequestUrl', () => {
  it('二次验证失败时不触发会话恢复', () => {
    expect(isAuthRecoveryExcludedRequestUrl('/auth/step-up')).toBe(true)
  })

  it('匿名认证接口不触发会话恢复', () => {
    expect(isAuthRecoveryExcludedRequestUrl('/auth/login')).toBe(true)
    expect(isAuthRecoveryExcludedRequestUrl('/auth/register')).toBe(true)
    expect(isAuthRecoveryExcludedRequestUrl('/auth/refresh')).toBe(true)
  })

  it('普通受保护接口仍允许会话恢复', () => {
    expect(isAuthRecoveryExcludedRequestUrl('/user/123/roles')).toBe(false)
    expect(isAuthRecoveryExcludedRequestUrl(undefined)).toBe(false)
  })
})
