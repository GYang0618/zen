import {
  createErrorMiddleware,
  createRequestMiddleware,
  createResponseMiddleware,
  isAxiosError
} from '@zen/request'

import { useAuthStore } from '@/stores'

import { isAuthRecoveryExcludedRequestUrl } from './auth-paths'
import { http } from './client'
import {
  beginRefreshAuthSession,
  ensureFreshAccessToken,
  notifyRefreshFailure
} from './refresh-session'
import { ApiClientError } from './types'
import { unwrapResponseData } from './unwrap-response'
import { buildFallback, fallbackMessage, isRequestErrorResponse } from './utils'

import type { AxiosError, AxiosResponse } from '@zen/request'
import type { RequestErrorResponse, RetryableRequestConfig } from './types'

export { unwrapResponseData } from './unwrap-response'

/* token设置中间件：过期前先换发，避免业务请求先 401 */
export const withTokenMiddleware = createRequestMiddleware(async (config) => {
  if (isAuthRecoveryExcludedRequestUrl(config.url)) {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  }

  const token = await ensureFreshAccessToken()
  if (token && config.headers) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/* 数据转换中间件 */
export const dataTransformMiddleware = createResponseMiddleware((response) => {
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
  const message = fallbackMessage(status)

  if (status === 401 && !isAuthRecoveryExcludedRequestUrl(error.config?.url)) {
    useAuthStore.getState().clearAuth()
    return Promise.reject(new ApiClientError(data ?? buildFallback(status, message)))
  }

  if (isRequestErrorResponse(data)) {
    return Promise.reject(new ApiClientError(data))
  }

  return Promise.reject(new Error(message))
})

export const tokenRefreshMiddleware = createTokenRefreshMiddleware()

/* token刷新中间件：401 兜底，与主动续期共用单飞 refresh */
export function createTokenRefreshMiddleware() {
  const refreshCheck = (error: AxiosError): boolean => {
    const status = error.response?.status
    const originalConfig = error.config as RetryableRequestConfig | undefined

    if (status !== 401 || !originalConfig) return false
    if (originalConfig._retry) return false
    if (isAuthRecoveryExcludedRequestUrl(originalConfig.url)) return false

    return true
  }

  const retryWithAccessToken = (config: RetryableRequestConfig, accessToken: string) => {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
    return http(config)
  }

  return createErrorMiddleware(async (error) => {
    if (!isAxiosError(error)) return Promise.reject(error)

    if (!refreshCheck(error)) return Promise.reject(error)

    const originalConfig = error.config as RetryableRequestConfig
    originalConfig._retry = true

    const { isLeader, promise } = beginRefreshAuthSession()

    try {
      const session = await promise
      return retryWithAccessToken(originalConfig, session.accessToken)
    } catch (cause: unknown) {
      notifyRefreshFailure(cause, isLeader)
      return Promise.reject(cause)
    }
  })
}
