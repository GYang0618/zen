import {
  createErrorMiddleware,
  createHttpClient,
  createRequestMiddleware,
  createResponseMiddleware,
  isAxiosError
} from '@zen/request'

import { useEnv } from '@/config/env'
import { useAuthStore } from '@/stores'

import { isAuthAnonymousRequestUrl } from './auth-paths'
import { http } from './client'
import { ApiClientError } from './types'
import { buildFallback, fallbackMessage, isRequestErrorResponse } from './utils'

import type { AxiosError, AxiosResponse } from '@zen/request'
import type { AuthSession } from '@zen/shared'
import type { RequestErrorResponse, RequestResponse, RetryableRequestConfig } from './types'

type RefreshQueueEntry = {
  resolve: (accessToken: string) => void
  reject: (error: unknown) => void
}

const anonymousHttp = createHttpClient(() => {
  const { baseUrl, apiTimeout } = useEnv()
  return {
    baseURL: baseUrl,
    timeout: apiTimeout,
    withCredentials: true
  }
})

/* token设置中间件 */
export const withTokenMiddleware = createRequestMiddleware((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/* 数据转换中间件 */
export const dataTransformMiddleware = createResponseMiddleware((response) => {
  // 断言为AxiosResponse，真实数据跟据具体泛型决定，这只是解决类型兼容问题
  const data = unwrapResponseData(response) as AxiosResponse
  return data ?? response.data ?? response
})

/* 全局错误处理中间件 */
export const globalErrorMiddleware = createErrorMiddleware((error) => {
  if (!isAxiosError(error)) {
    return Promise.reject(error)
  }

  const status = error.response?.status
  const data = error.response?.data as RequestErrorResponse | undefined

  if (status === 401 && !isAuthAnonymousRequestUrl(error.config?.url)) {
    useAuthStore.getState().clearAuth()
    return Promise.reject(
      new ApiClientError(data ?? buildFallback(status, '登录已过期，请重新登录'))
    )
  }

  if (isRequestErrorResponse(data)) {
    return Promise.reject(new ApiClientError(data))
  }

  const message = fallbackMessage(status)
  return Promise.reject(new Error(message))
})

export const tokenRefreshMiddleware = createTokenRefreshMiddleware()

/* token刷新中间件 */
let isTokenRefreshing = false
let refreshQueue: RefreshQueueEntry[] = []

// 刷新队列函数
function flushRefreshQueue(error: unknown, accessToken: string | null) {
  for (const item of refreshQueue) {
    if (error) {
      item.reject(error)
    } else if (accessToken) {
      item.resolve(accessToken)
    } else {
      item.reject(new Error('Refresh token 失效'))
    }
  }
  refreshQueue = []
}

export function createTokenRefreshMiddleware() {
  // 检查是否需要刷新
  const refreshCheck = (error: AxiosError): boolean => {
    const status = error.response?.status
    const originalConfig = error.config as RetryableRequestConfig | undefined

    if (status !== 401 || !originalConfig) return false
    if (originalConfig._retry) return false

    // 避免对匿名请求进行刷新，导致死循环
    if (isAuthAnonymousRequestUrl(originalConfig.url)) return false

    return true
  }

  // 重试请求
  const retryWithAccessToken = (config: RetryableRequestConfig, accessToken: string) => {
    config.headers.set('Authorization', `Bearer ${accessToken}`)

    return http(config)
  }

  // 重新获取auth session（token）
  const refreshAuthSession = async (): Promise<AuthSession | null> => {
    try {
      const response = await anonymousHttp.post('/auth/refresh')
      const session = unwrapResponseData<AuthSession>(response)
      if (!session) return null
      return session
    } catch {
      return null
    }
  }

  // 结算队列中的请求
  const settleRefreshQueue = (
    options: { type: 'resolve'; session: AuthSession } | { type: 'reject'; message: string }
  ) => {
    const { clearAuth, setAuth } = useAuthStore.getState()
    if (options.type === 'resolve') {
      setAuth(options.session)
      isTokenRefreshing = false
      flushRefreshQueue(null, options.session.accessToken)
    } else {
      isTokenRefreshing = false
      const refreshError = new Error(options.message)
      flushRefreshQueue(refreshError, null)
      clearAuth()
    }
  }

  return createErrorMiddleware(async (error) => {
    if (!isAxiosError(error)) return Promise.reject(error)

    const shouldRefresh = refreshCheck(error)
    if (!shouldRefresh) return Promise.reject(error)

    const originalConfig = error.config as RetryableRequestConfig

    originalConfig._retry = true

    if (isTokenRefreshing) {
      const accessToken = await new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      })
      return retryWithAccessToken(originalConfig, accessToken)
    }

    isTokenRefreshing = true

    const refreshedSession = await refreshAuthSession()

    if (!refreshedSession) {
      settleRefreshQueue({ type: 'reject', message: '刷新会话失败' })
      return Promise.reject(error)
    }

    settleRefreshQueue({ type: 'resolve', session: refreshedSession })

    return retryWithAccessToken(originalConfig, refreshedSession.accessToken)
  })
}

function unwrapResponseData<T = unknown>(response: AxiosResponse<RequestResponse<T>>): T | null {
  const body = response.data
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data
  }
  return null
}
