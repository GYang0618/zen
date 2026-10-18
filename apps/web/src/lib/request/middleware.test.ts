import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores'

vi.mock('./client', () => ({ http: {} }))

import { globalErrorMiddleware } from './middleware'

describe('globalErrorMiddleware', () => {
  afterEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('does not clear authentication for a business API 401', async () => {
    useAuthStore.getState().setToken('current-access-token')
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      isAxiosError: true,
      config: { url: '/private/resource' },
      response: {
        status: 401,
        data: {
          code: 401,
          message: '令牌无效或已过期',
          path: '/private/resource',
          timestamp: new Date().toISOString()
        }
      }
    })

    await expect(globalErrorMiddleware(unauthorized)).rejects.toMatchObject({ code: 401 })
    expect(useAuthStore.getState().accessToken).toBe('current-access-token')
  })
})
