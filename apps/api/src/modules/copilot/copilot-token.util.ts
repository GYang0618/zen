/** 从请求头解析 Bearer access token（支持 Web Request Headers 与 Express headers） */
export function extractBearerToken(headers: unknown): string | undefined {
  if (!headers) return undefined
  let authorization: string | undefined
  if (typeof (headers as Headers).get === 'function') {
    authorization = (headers as Headers).get('authorization') ?? undefined
  } else if (typeof headers === 'object' && headers !== null) {
    const raw = (headers as Record<string, unknown>).authorization
    authorization = Array.isArray(raw) ? raw[0] : typeof raw === 'string' ? raw : undefined
  }
  if (!authorization) return undefined
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim())
  return match?.[1]
}
