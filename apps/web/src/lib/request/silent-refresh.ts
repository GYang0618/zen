import { useAuthStore } from '@/stores'

import { anonymousHttp } from './client'
import { unwrapResponseData } from './middleware'

import type { AuthSession } from '@zen/shared'

/**
 * 权限版本（permVer）变更后主动换发 accessToken，
 * 避免紧随其后的业务请求先 401 再走中间件刷新。
 */
export async function silentRefreshAuthSession(): Promise<void> {
  try {
    const response = await anonymousHttp.post('/auth/refresh')
    const session = unwrapResponseData<AuthSession>(response)
    if (session) {
      useAuthStore.getState().setAuth(session)
    }
  } catch {
    // 由 tokenRefreshMiddleware 在后续 401 时再尝试
  }
}
