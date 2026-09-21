import { classifyToolError } from '@/api/tool-failure'
import { isRecord } from '@/api/tool-result'
import { RETRYABLE_READ_TOOLS } from '@/tools/policy'

import type { ToolErrorReason } from '@/api/tool-failure'

const RETRIABLE_TOOL_REASONS = new Set<ToolErrorReason>([
  'NETWORK_ERROR',
  'RATE_LIMITED',
  'TIMEOUT',
  'TOOL_UNAVAILABLE'
])

const RETRIABLE_HTTP_STATUSES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504 // Gateway Timeout
])

const NON_RETRIABLE_ERROR_NAMES = new Set([
  'BadRequestError',
  'AuthenticationError',
  'PermissionDeniedError',
  'NotFoundError',
  'ConflictError',
  'UnprocessableEntityError',
  'AbortError'
])

const RETRIABLE_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT'
])

function extractErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined
  if (typeof error.status === 'number') return error.status
  if (typeof error.statusCode === 'number') return error.statusCode
  const response = error.response
  if (isRecord(response) && typeof response.status === 'number') {
    return response.status
  }
  if (typeof error.message === 'string') {
    const match = error.message.match(
      /(?:^|\b)(?:status\s*[:=]\s*|code\s*[:=]\s*)?\b([45]\d{2})\b/i
    )
    if (match?.[1]) {
      const parsed = Number.parseInt(match[1], 10)
      if (!Number.isNaN(parsed)) return parsed
    }
  }
  return undefined
}

/**
 * 判断模型调用异常是否为瞬态错误且具备重试价值。
 *
 * 排除 4xx 客户端参数错误（如 400 reasoning_content 缺失、401 密钥失效、403 越权、404 模型不存在等），
 * 避免盲目重试引发延迟与错误掩盖；仅对 429、5xx 及网络瞬态故障执行退避重试。
 */
export function isRetriableModelError(error: unknown): boolean {
  if (!isRecord(error)) return false

  const name = typeof error.name === 'string' ? error.name : ''
  if (NON_RETRIABLE_ERROR_NAMES.has(name)) return false

  const message = typeof error.message === 'string' ? error.message.toLowerCase() : ''
  if (message.includes('abort') || message.includes('cancel')) return false

  const status = extractErrorStatus(error)
  if (status !== undefined) {
    if (RETRIABLE_HTTP_STATUSES.has(status)) return true
    if (status >= 400 && status < 500) return false
    if (status >= 500 && status < 600) return true
  }

  const code = typeof error.code === 'string' ? error.code : ''
  if (RETRIABLE_NETWORK_CODES.has(code)) return true

  return (
    name === 'RateLimitError' ||
    name === 'InternalServerError' ||
    name === 'APIConnectionError' ||
    name === 'APIConnectionTimeoutError' ||
    name === 'TimeoutError' ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('socket hang up') ||
    message.includes('connection reset') ||
    message.includes('timeout') ||
    message.includes('timed out')
  )
}

/**
 * 判断工具执行异常是否为瞬态网络或服务端错误。
 * 业务校验失败（400/422）与权限错误（401/403）均不重试，直接由 toolErrorMiddleware 转换为 ToolMessage 交付纠偏。
 */
export function isRetriableToolError(error: unknown): boolean {
  return RETRIABLE_TOOL_REASONS.has(classifyToolError(error))
}

/** 模型重试中间件优化配置 */
export const MODEL_RETRY_CONFIG = {
  maxRetries: 2,
  backoffFactor: 2.0,
  initialDelayMs: 1000,
  maxDelayMs: 10_000,
  jitter: true,
  retryOn: isRetriableModelError,
  onFailure: 'error' as const
}

/** 工具重试中间件优化配置：仅限安全只读工具且仅限瞬态网络异常 */
export const TOOL_RETRY_CONFIG = {
  tools: RETRYABLE_READ_TOOLS,
  maxRetries: 2,
  backoffFactor: 2.0,
  initialDelayMs: 1000,
  maxDelayMs: 10_000,
  jitter: true,
  retryOn: isRetriableToolError,
  onFailure: 'error' as const
}
