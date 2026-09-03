import { refreshAuthSessionOnce } from './refresh-session'

/**
 * 权限版本（permVer）变更后主动换发 accessToken，
 * 避免紧随其后的业务请求先 401 再走中间件刷新。
 */
export async function silentRefreshAuthSession(): Promise<void> {
  try {
    await refreshAuthSessionOnce()
  } catch {
    // 由 tokenRefreshMiddleware 在后续 401 时再尝试
  }
}
