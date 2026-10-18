import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from '@/lib/request/types'
import { useAuthStore } from '@/stores'

import { authApi } from './api'
import { ensureAuthenticatedSession } from './ensure-session'

vi.mock('./api', () => ({
  authApi: {
    refresh: vi.fn()
  }
}))

const refresh = vi.mocked(authApi.refresh)

describe('ensureAuthenticatedSession', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    refresh.mockReset()
  })

  afterEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('propagates refresh service failures when no access token is in memory', async () => {
    const serviceUnavailable = new ApiClientError({
      code: 503,
      message: '服务暂时不可用',
      path: '/auth/refresh',
      timestamp: new Date().toISOString()
    })
    refresh.mockRejectedValue(serviceUnavailable)

    await expect(ensureAuthenticatedSession('/dashboard')).rejects.toBe(serviceUnavailable)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('keeps the existing session when refresh fails temporarily', async () => {
    const expiry = Math.floor((Date.now() - 1_000) / 1000)
    const payload = btoa(JSON.stringify({ exp: expiry }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
    const accessToken = `header.${payload}.signature`
    useAuthStore.getState().setToken(accessToken)
    refresh.mockRejectedValue(
      new ApiClientError({
        code: 503,
        message: '服务暂时不可用',
        path: '/auth/refresh',
        timestamp: new Date().toISOString()
      })
    )

    await expect(ensureAuthenticatedSession('/dashboard')).resolves.toBeUndefined()
    expect(useAuthStore.getState().accessToken).toBe(accessToken)
  })

  it('redirects to sign-in only when the refresh token is rejected', async () => {
    refresh.mockRejectedValue(
      new ApiClientError({
        code: 401,
        message: '刷新令牌无效或已过期',
        path: '/auth/refresh',
        timestamp: new Date().toISOString()
      })
    )

    await expect(ensureAuthenticatedSession('/dashboard')).rejects.toMatchObject({
      options: { to: '/sign-in' }
    })
  })
})
