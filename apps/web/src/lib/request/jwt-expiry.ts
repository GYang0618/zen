/** Access Token 到期前多久主动换发，避免业务请求先打出 401。 */
export const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000

/**
 * 读取 JWT `exp`（秒）并转为毫秒时间戳。解析失败时返回 undefined。
 */
export function getAccessTokenExpiryMs(token: string): number | undefined {
  const segment = token.split('.')[1]
  if (!segment) return undefined

  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const json = globalThis.atob(padded)
    const payload = JSON.parse(json) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : undefined
  } catch {
    return undefined
  }
}

/**
 * 令牌已过期或进入续期窗口时返回 true。
 * 无法解析 `exp` 时返回 false，交由 401 中间件兜底。
 */
export function isAccessTokenExpiringSoon(
  token: string,
  now = Date.now(),
  skewMs = ACCESS_TOKEN_REFRESH_SKEW_MS
): boolean {
  const expiryMs = getAccessTokenExpiryMs(token)
  if (expiryMs === undefined) return false
  return expiryMs - now <= skewMs
}
