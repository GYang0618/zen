import { isAxiosError } from '@zen/request'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores'

import { anonymousHttp } from './client'
import {
  ACCESS_TOKEN_REFRESH_SKEW_MS,
  getAccessTokenExpiryMs,
  isAccessTokenExpiringSoon
} from './jwt-expiry'
import { ApiClientError } from './types'
import { unwrapResponseData } from './unwrap-response'
import { buildFallback, fallbackMessage, isRequestErrorResponse } from './utils'

import type { AuthSession } from '@zen/shared'
import type { RequestErrorResponse } from './types'

const AUTH_REFRESH_LOCK = 'zen-auth-refresh'

type RefreshHandle = {
  isLeader: boolean
  promise: Promise<AuthSession>
}

let inflight: Promise<AuthSession> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | undefined
let schedulerStarted = false
let unsubscribeAuthStore: (() => void) | undefined

export function isRefreshUnauthorizedFailure(cause: unknown): boolean {
  if (!isAxiosError(cause)) return false
  return cause.response?.status === 401
}

/** 将刷新失败转为非 Axios 错误，避免走 globalErrorMiddleware 时误清登录态。 */
export function refreshFailureToClientError(cause: unknown): Error {
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

/**
 * 单飞刷新：同页并发与多标签页（Web Locks）共用一次 /auth/refresh，
 * 避免 refresh token 轮转把后续请求打成 401 并清掉登录态。
 */
export function beginRefreshAuthSession(): RefreshHandle {
  const isLeader = !inflight
  if (!inflight) {
    inflight = runRefreshAuthSession().finally(() => {
      inflight = null
    })
  }
  return { isLeader, promise: inflight }
}

export function refreshAuthSessionOnce(): Promise<AuthSession> {
  return beginRefreshAuthSession().promise
}

/**
 * 若当前 accessToken 已进入续期窗口则先换发，再返回可用 token。
 * 刷新失败时仍返回内存中的旧 token，由 401 中间件兜底。
 */
export async function ensureFreshAccessToken(): Promise<string | null> {
  const token = useAuthStore.getState().accessToken
  if (!token) return null
  if (!isAccessTokenExpiringSoon(token)) return token

  try {
    const session = await refreshAuthSessionOnce()
    return session.accessToken
  } catch {
    return useAuthStore.getState().accessToken
  }
}

/** 订阅登录态并在到期前主动换发；页面重新可见时补一次检查。 */
export function initAuthTokenRefreshScheduler(): void {
  if (schedulerStarted || typeof window === 'undefined') return
  schedulerStarted = true

  unsubscribeAuthStore = useAuthStore.subscribe((state, previous) => {
    if (state.accessToken === previous.accessToken) return
    scheduleAccessTokenRefresh(state.accessToken)
  })

  scheduleAccessTokenRefresh(useAuthStore.getState().accessToken)
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

export function resetRefreshAuthSessionForTests(): void {
  inflight = null
  clearRefreshTimer()
  unsubscribeAuthStore?.()
  unsubscribeAuthStore = undefined
  schedulerStarted = false
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

export function notifyRefreshFailure(error: unknown, isLeader: boolean): void {
  if (!isLeader) return
  const message = error instanceof Error ? error.message : fallbackMessage(undefined)
  toast.error(message)
}

function handleVisibilityChange() {
  if (document.visibilityState !== 'visible') return
  const token = useAuthStore.getState().accessToken
  if (!token || !isAccessTokenExpiringSoon(token)) return
  void refreshAuthSessionOnce().catch(() => undefined)
}

function scheduleAccessTokenRefresh(token: string | null) {
  clearRefreshTimer()
  if (!token) return

  const expiryMs = getAccessTokenExpiryMs(token)
  if (expiryMs === undefined) return

  const delay = Math.max(expiryMs - Date.now() - ACCESS_TOKEN_REFRESH_SKEW_MS, 0)
  refreshTimer = setTimeout(() => {
    void refreshAuthSessionOnce().catch(() => undefined)
  }, delay)
}

async function runRefreshAuthSession(): Promise<AuthSession> {
  const execute = () => postRefresh()
  const locks = globalThis.navigator?.locks
  if (locks?.request) {
    return locks.request(AUTH_REFRESH_LOCK, execute)
  }
  return execute()
}

async function postRefresh(): Promise<AuthSession> {
  try {
    const response = await anonymousHttp.post('/auth/refresh')
    const session = unwrapResponseData<AuthSession>(response)
    if (!session?.accessToken) {
      throw new Error('刷新接口返回数据异常')
    }
    useAuthStore.getState().setAuth(session)
    return session
  } catch (cause: unknown) {
    const clientError = refreshFailureToClientError(cause)
    if (isRefreshUnauthorizedFailure(cause)) {
      useAuthStore.getState().clearAuth()
    }
    throw clientError
  }
}

function clearRefreshTimer() {
  if (refreshTimer === undefined) return
  clearTimeout(refreshTimer)
  refreshTimer = undefined
}
