import {
  createErrorMiddleware,
  createRequestMiddleware,
  createResponseMiddleware,
  isAxiosError
} from '@zen/request'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores'

import { isAuthAnonymousRequestUrl } from './auth-paths'
import { anonymousHttp, http } from './client'
import { ApiClientError } from './types'
import { buildFallback, fallbackMessage, isRequestErrorResponse } from './utils'

import type { AxiosError, AxiosResponse } from '@zen/request'
import type { AuthSession } from '@zen/shared'
import type { RequestErrorResponse, RequestResponse, RetryableRequestConfig } from './types'

type RefreshQueueEntry = {
  resolve: (accessToken: string) => void
  reject: (error: unknown) => void
}

type RefreshAuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; reason: 'auth' | 'transient'; cause: unknown }

export function isRefreshUnauthorizedFailure(cause: unknown): boolean {
  if (!isAxiosError(cause)) return false
  return cause.response?.status === 401
}

/** 将刷新失败转为非 Axios 错误，避免走 globalErrorMiddleware 时误清登录态（如原请求仍为 401）。 */
function refreshFailureToClientError(cause: unknown): Error {
  if (!isAxiosError(cause)) {
    if (cause instanceof Error) return cause
    return new ApiClientError(buildFallback(503, fallbackMessage(undefined)))
  }

  const status = cause.response?.status
  const data = cause.response?.data as RequestErrorResponse | undefined

  if (status !== undefined && isRequestErrorResponse(data)) {
    return new ApiClientError(data)
  }

  if (status !== undefined) {
    return new ApiClientError(buildFallback(status, fallbackMessage(status)))
  }

  return new ApiClientError(buildFallback(503, fallbackMessage(undefined)))
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
  const message = fallbackMessage(status)

  if (status === 401 && !isAuthAnonymousRequestUrl(error.config?.url)) {
    useAuthStore.getState().clearAuth()
    return Promise.reject(new ApiClientError(data ?? buildFallback(status, message)))
  }

  if (isRequestErrorResponse(data)) {
    return Promise.reject(new ApiClientError(data))
  }

  return Promise.reject(new Error(message))
})

export const tokenRefreshMiddleware = createTokenRefreshMiddleware()

/* token刷新中间件 */
let isTokenRefreshing = false
let refreshQueue: RefreshQueueEntry[] = []

// 刷新队列：有 error 则全部拒绝；无 error 则必须带新 accessToken 再 resolve
function flushRefreshQueue(error: Error | null, accessToken: string | null) {
  for (const item of refreshQueue) {
    if (error) {
      item.reject(error)
    } else if (accessToken) {
      item.resolve(accessToken)
    } else {
      item.reject(new Error('Unexpected refresh queue state'))
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

  const refreshAuthSession = async (): Promise<RefreshAuthResult> => {
    try {
      const response = await anonymousHttp.post('/auth/refresh')
      const session = unwrapResponseData<AuthSession>(response)
      if (!session) {
        return {
          ok: false,
          reason: 'transient',
          cause: new Error('刷新接口返回数据异常')
        }
      }
      return { ok: true, session }
    } catch (cause: unknown) {
      if (isRefreshUnauthorizedFailure(cause)) {
        return { ok: false, reason: 'auth', cause }
      }
      return { ok: false, reason: 'transient', cause }
    }
  }

  const settleRefreshQueue = (
    options:
      | { type: 'resolve'; session: AuthSession }
      | { type: 'reject'; error: Error; clearAuth: boolean }
  ) => {
    const { clearAuth, setAuth } = useAuthStore.getState()
    if (options.type === 'resolve') {
      setAuth(options.session)
      isTokenRefreshing = false
      flushRefreshQueue(null, options.session.accessToken)
    } else {
      isTokenRefreshing = false
      flushRefreshQueue(options.error, null)
      if (options.clearAuth) {
        clearAuth()
      }
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

    const refreshed = await refreshAuthSession()

    if (!refreshed.ok) {
      const clientError = refreshFailureToClientError(refreshed.cause)
      settleRefreshQueue({
        type: 'reject',
        error: clientError,
        clearAuth: refreshed.reason === 'auth'
      })
      toast.error(clientError.message)
      return Promise.reject(clientError)
    }

    settleRefreshQueue({ type: 'resolve', session: refreshed.session })

    return retryWithAccessToken(originalConfig, refreshed.session.accessToken)
  })
}

export function unwrapResponseData<T = unknown>(
  response: AxiosResponse<RequestResponse<T>>
): T | null {
  const body = response.data
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data
  }
  return null
}
