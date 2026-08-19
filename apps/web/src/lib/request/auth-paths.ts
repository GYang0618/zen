/**
 * 匿名认证相关接口 URL 片段：这些请求的 401 不应触发 refresh（避免死循环）。
 */
export const AUTH_ANONYMOUS_URL_PARTS = ['/auth/login', '/auth/register', '/auth/refresh'] as const

/**
 * 这些接口的 401 表示本次身份验证失败，而非访问令牌失效。
 * 不应刷新会话或清空登录态。
 */
export const AUTH_RECOVERY_EXCLUDED_URL_PARTS = [
  ...AUTH_ANONYMOUS_URL_PARTS,
  '/auth/step-up'
] as const

export function isAuthAnonymousRequestUrl(url: string | undefined): boolean {
  if (!url) return false
  return AUTH_ANONYMOUS_URL_PARTS.some((fragment) => url.includes(fragment))
}

export function isAuthRecoveryExcludedRequestUrl(url: string | undefined): boolean {
  if (!url) return false
  return AUTH_RECOVERY_EXCLUDED_URL_PARTS.some((fragment) => url.includes(fragment))
}
