import { describe, expect, it } from 'vitest'

import {
  ACCESS_TOKEN_REFRESH_SKEW_MS,
  getAccessTokenExpiryMs,
  isAccessTokenExpiringSoon
} from './jwt-expiry'

function makeJwt(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: expSeconds }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
  return `header.${payload}.sig`
}

describe('jwt-expiry', () => {
  it('读取 JWT exp 为毫秒时间戳', () => {
    expect(getAccessTokenExpiryMs(makeJwt(1_700_000_000))).toBe(1_700_000_000_000)
  })

  it('无法解析时返回 undefined', () => {
    expect(getAccessTokenExpiryMs('not-a-jwt')).toBeUndefined()
    expect(getAccessTokenExpiryMs('a.%%%.c')).toBeUndefined()
  })

  it('进入续期窗口或已过期时判定为即将过期', () => {
    const now = 1_700_000_000_000
    const expiringAt = Math.floor((now + ACCESS_TOKEN_REFRESH_SKEW_MS) / 1000)
    const freshAt = Math.floor((now + ACCESS_TOKEN_REFRESH_SKEW_MS) / 1000) + 1
    const expiredAt = Math.floor((now - 1) / 1000)

    expect(isAccessTokenExpiringSoon(makeJwt(expiringAt), now)).toBe(true)
    expect(isAccessTokenExpiringSoon(makeJwt(freshAt), now)).toBe(false)
    expect(isAccessTokenExpiringSoon(makeJwt(expiredAt), now)).toBe(true)
  })

  it('无法解析 exp 时不主动刷新', () => {
    expect(isAccessTokenExpiringSoon('opaque-token')).toBe(false)
  })
})
