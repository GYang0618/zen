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
import { ApiClientError } from './types'
import { buildFallback, fallbackMessage, isRequestErrorResponse } from './utils'

import type { AxiosRequestConfig, AxiosResponse } from '@zen/request'
import type { AuthUser } from '@/stores'
import type { RequestErrorResponse } from './types'

const anonymousHttp = createHttpClient(() => {
  const { baseUrl, apiTimeout } = useEnv()
  return {
    baseURL: baseUrl,
    timeout: apiTimeout,
    withCredentials: true
  }
})

type RefreshQueueItem = {
  resolve: (accessToken: string) => void
  reject: (error: unknown) => void
}

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean
}

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
  return unwrapApiData(response) as AxiosResponse
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

/* token刷新中间件 */
let isRefreshing = false
let refreshQueue: RefreshQueueItem[] = []

export const tokenRefreshMiddleware = createErrorMiddleware(async (error) => {
  if (!isAxiosError(error)) {
    return Promise.reject(error)
  }

  const status = error.response?.status
  const originalConfig = error.config as unknown as RetryableRequestConfig | undefined

  if (status !== 401 || !originalConfig) {
    return Promise.reject(error)
  }

  if (originalConfig._retry) {
    return Promise.reject(error)
  }

  if (isAuthAnonymousRequestUrl(originalConfig.url)) {
    return Promise.reject(error)
  }

  originalConfig._retry = true

  if (isRefreshing) {
    const accessToken = await new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject })
    })
    return retryRequest(originalConfig, accessToken)
  }

  isRefreshing = true

  const nextSession = await refreshSession()
  if (!nextSession) {
    isRefreshing = false
    const refreshError = new Error('刷新会话失败')
    processRefreshQueue(refreshError, null)
    useAuthStore.getState().clearAuth()
    return Promise.reject(error)
  }

  useAuthStore.getState().setAuth(nextSession)

  isRefreshing = false
  processRefreshQueue(null, nextSession.accessToken)

  return retryRequest(originalConfig, nextSession.accessToken)
})

function unwrapApiData(response: AxiosResponse<unknown>): unknown {
  const body = response.data
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: unknown }).data
  }
  return body
}

function setAuthorizationHeader(config: RetryableRequestConfig, accessToken: string | null) {
  if (!accessToken) return

  const headers = config.headers
  if (
    headers &&
    typeof headers === 'object' &&
    'set' in headers &&
    typeof (headers as { set?: unknown }).set === 'function'
  ) {
    ;(headers as { set: (key: string, value: string) => void }).set(
      'Authorization',
      `Bearer ${accessToken}`
    )
    return
  }

  config.headers = {
    ...(typeof headers === 'object' && headers ? (headers as Record<string, unknown>) : {}),
    Authorization: `Bearer ${accessToken}`
  }
}

async function refreshSession(): Promise<{ accessToken: string; user: AuthUser } | null> {
  try {
    const response = await anonymousHttp.request({ method: 'POST', url: '/auth/refresh' })
    const session = unwrapApiData(response as unknown as AxiosResponse) as {
      accessToken?: unknown
      user?: unknown
    }

    if (!session || typeof session !== 'object') return null
    if (typeof session.accessToken !== 'string') return null

    return {
      accessToken: session.accessToken,
      user: session.user as AuthUser
    }
  } catch {
    return null
  }
}

function processRefreshQueue(error: unknown, accessToken: string | null) {
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

async function retryRequest(config: RetryableRequestConfig, accessToken: string): Promise<unknown> {
  const nextConfig: RetryableRequestConfig = {
    ...config,
    withCredentials: true
  }
  setAuthorizationHeader(nextConfig, accessToken)

  const response = await anonymousHttp.request(nextConfig)
  return unwrapApiData(response as unknown as AxiosResponse)
}
