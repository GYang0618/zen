import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores'

import { ACCESS_TOKEN_REFRESH_SKEW_MS } from './jwt-expiry'
import {
  ensureFreshAccessToken,
  refreshAuthSessionOnce,
  resetRefreshAuthSessionForTests
} from './refresh-session'

import type { AuthSession } from '@zen/shared'

const post = vi.hoisted(() => vi.fn())

vi.mock('./client', () => ({
  anonymousHttp: {
    post
  }
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() }
}))

function makeJwt(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: expSeconds }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
  return `header.${payload}.sig`
}

function makeSession(accessToken: string): AuthSession {
  return {
    accessToken,
    user: {
      id: 'user-1',
      username: 'demo',
      nickname: null,
      phoneNumber: null,
      email: 'demo@example.com',
      role: 'admin',
      permissions: [],
      avatar: null
    }
  }
}

function wrapSession(session: AuthSession) {
  return {
    data: {
      code: 200,
      message: 'ok',
      data: session,
      timestamp: new Date().toISOString()
    }
  }
}

describe('refreshAuthSessionOnce', () => {
  beforeEach(() => {
    resetRefreshAuthSessionForTests()
    useAuthStore.getState().clearAuth()
    post.mockReset()
  })

  afterEach(() => {
    resetRefreshAuthSessionForTests()
    useAuthStore.getState().clearAuth()
  })

  it('并发调用只请求一次 refresh 并写入新会话', async () => {
    const session = makeSession('next-token')
    let resolvePost: ((value: unknown) => void) | undefined
    post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve
        })
    )

    const first = refreshAuthSessionOnce()
    const second = refreshAuthSessionOnce()
    resolvePost?.(wrapSession(session))

    await expect(Promise.all([first, second])).resolves.toEqual([session, session])
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('/auth/refresh')
    expect(useAuthStore.getState().accessToken).toBe('next-token')
  })

  it('refresh 返回 401 时清空登录态', async () => {
    useAuthStore.getState().setToken('stale-token')
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          code: 401,
          message: '刷新令牌无效或已过期',
          path: '/auth/refresh',
          timestamp: new Date().toISOString()
        }
      }
    })
    post.mockRejectedValue(unauthorized)

    await expect(refreshAuthSessionOnce()).rejects.toMatchObject({ code: 401 })
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('未进入续期窗口时不发 refresh', async () => {
    const freshExp = Math.floor((Date.now() + ACCESS_TOKEN_REFRESH_SKEW_MS + 120_000) / 1000)
    const token = makeJwt(freshExp)
    useAuthStore.getState().setToken(token)

    await expect(ensureFreshAccessToken()).resolves.toBe(token)
    expect(post).not.toHaveBeenCalled()
  })

  it('已过期时先续期再返回新 token', async () => {
    const expiredExp = Math.floor((Date.now() - 5_000) / 1000)
    useAuthStore.getState().setToken(makeJwt(expiredExp))
    const session = makeSession('renewed-token')
    post.mockResolvedValue(wrapSession(session))

    await expect(ensureFreshAccessToken()).resolves.toBe('renewed-token')
    expect(post).toHaveBeenCalledTimes(1)
  })
})
