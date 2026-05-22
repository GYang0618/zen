import type { Request } from 'express'

/** 从请求头解析 Bearer access token */
export function extractBearerToken(headers: Request['headers']): string | undefined {
  const raw = headers.authorization
  const authorization = Array.isArray(raw) ? raw[0] : raw
  if (!authorization) {
    return undefined
  }

  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim())
  return match?.[1]
}
