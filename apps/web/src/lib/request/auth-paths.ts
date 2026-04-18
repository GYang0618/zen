/**
 * 匿名认证相关接口 URL 片段：这些请求的 401 不应触发 refresh（避免死循环）。
 */
export const AUTH_ANONYMOUS_URL_PARTS = ['/auth/login', '/auth/register', '/auth/refresh'] as const

export function isAuthAnonymousRequestUrl(url: string | undefined): boolean {
  if (!url) return false
  return AUTH_ANONYMOUS_URL_PARTS.some((fragment) => url.includes(fragment))
}
