import { redirect } from '@tanstack/react-router'

import { isAccessTokenExpiringSoon } from '@/lib/request/jwt-expiry'
import { isForbidden, isSessionExpired } from '@/lib/request/utils'
import { useAuthStore } from '@/stores'

import { authApi } from './api'

/**
 * 保证内存中有可用登录态。只有刷新令牌明确失效时才跳转登录页。
 */
export async function ensureAuthenticatedSession(redirectPath: string): Promise<void> {
  const existingToken = useAuthStore.getState().accessToken
  if (existingToken && !isAccessTokenExpiringSoon(existingToken)) return

  try {
    const session = await authApi.refresh()
    useAuthStore.getState().setAuth(session)
  } catch (error) {
    const canContinueWithExisting = Boolean(existingToken) && !isSessionExpired(error)
    if (canContinueWithExisting) return
    if (isForbidden(error)) {
      throw redirect({ to: '/errors/403', replace: true })
    }
    if (isSessionExpired(error)) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: redirectPath },
        replace: true
      })
    }
    throw error
  }
}
