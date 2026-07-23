import { randomUUID } from 'node:crypto'

import type { IncomingHttpHeaders } from 'node:http'

export const TRACE_ID_HEADER = 'x-trace-id'
export const REQUEST_ID_HEADER = 'x-request-id'

type HeaderSource = IncomingHttpHeaders | Record<string, string | string[] | undefined>

function readHeader(headers: HeaderSource, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(value)) {
    return value[0]
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  return undefined
}

/**
 * 解析或生成 traceId：优先 x-trace-id，其次 x-request-id / 已有 req.id，否则新建 UUID。
 */
export function resolveTraceId(input: { existingId?: string; headers: HeaderSource }): string {
  return (
    readHeader(input.headers, TRACE_ID_HEADER) ||
    readHeader(input.headers, REQUEST_ID_HEADER) ||
    (input.existingId !== null && input.existingId !== undefined && input.existingId !== ''
      ? String(input.existingId)
      : undefined) ||
    randomUUID()
  )
}
