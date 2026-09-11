import { isToolFailurePayload, mergeErrorEnvelope } from './tool-result'

import type { ApiErrorResponseSwaggerDto } from '../api-client/types.gen'
import type { ApiErrorEnvelope } from './tool-result'

export type RecoverableHint = {
  match: string
  reason: string
  hint: string
}

export type ToolFailureResult = ApiErrorEnvelope

export type ToolErrorReason =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'STEP_UP_REQUIRED'
  | 'BUSINESS_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'TOOL_UNAVAILABLE'
  | 'UNKNOWN_ERROR'

const GENERIC_RETRY_HINT = '请根据错误修正参数后重试；若缺少用户提供的信息，向用户询问后再调用。'
const NO_RETRY_HINT = '请向用户说明原因，不要再次调用同一工具或任何等效写操作。'

const NON_RETRYABLE_REASONS = new Set<ToolErrorReason>([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'STEP_UP_REQUIRED'
])

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const record = error as Record<string, unknown>
  if (typeof record.status === 'number') return record.status
  // The generated OpenAPI client throws the parsed API error envelope directly.
  // Its HTTP status is exposed as the top-level numeric `code` field.
  if (typeof record.code === 'number') return record.code
  const response = record.response
  if (typeof response === 'object' && response !== null) {
    const status = (response as Record<string, unknown>).status
    if (typeof status === 'number') return status
  }
  return undefined
}

export function classifyToolError(error: unknown): ToolErrorReason {
  const status = errorStatus(error)
  if (status === 400 || status === 422) return 'VALIDATION_ERROR'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) {
    return formatApiError(error).includes('二次确认') ? 'STEP_UP_REQUIRED' : 'FORBIDDEN'
  }
  if (status === 429) return 'RATE_LIMITED'
  if (status !== undefined && status >= 400 && status < 500) return 'BUSINESS_ERROR'
  if (status !== undefined && status >= 500) return 'TOOL_UNAVAILABLE'

  const record =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : undefined
  const code = typeof record?.code === 'string' ? record.code : ''
  const message = formatApiError(error).toLowerCase()
  if (code === 'ABORT_ERR' || code === 'ETIMEDOUT' || message.includes('timeout')) return 'TIMEOUT'
  if (
    ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(code) ||
    message.includes('fetch failed') ||
    message.includes('network')
  ) {
    return 'NETWORK_ERROR'
  }
  if (
    message.includes('access token') ||
    message.includes('unauthorized') ||
    message.includes('未登录') ||
    message.includes('未授权')
  ) {
    return 'UNAUTHORIZED'
  }
  return 'UNKNOWN_ERROR'
}

export function formatApiError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>

    if (typeof record.message === 'string' && record.message.trim() !== '') {
      return record.message
    }

    const nested = record.error
    if (typeof nested === 'object' && nested !== null && 'message' in nested) {
      const apiError = nested as ApiErrorResponseSwaggerDto
      if (typeof apiError.message === 'string') {
        return apiError.message
      }
    }

    if (typeof record.code === 'number' && typeof record.message === 'string') {
      return record.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function matchHint(message: string, hints: RecoverableHint[]): RecoverableHint | undefined {
  return hints.find((item) => message.includes(item.match))
}

function hintForReason(reason: string): string {
  return NON_RETRYABLE_REASONS.has(reason as ToolErrorReason) ? NO_RETRY_HINT : GENERIC_RETRY_HINT
}

function statusForReason(reason: string, error: unknown): number {
  const status = errorStatus(error)
  if (status !== undefined && status >= 400) return status
  switch (reason) {
    case 'UNAUTHORIZED':
      return 401
    case 'FORBIDDEN':
    case 'STEP_UP_REQUIRED':
      return 403
    case 'RATE_LIMITED':
      return 429
    case 'TOOL_UNAVAILABLE':
    case 'TIMEOUT':
    case 'NETWORK_ERROR':
    case 'UNKNOWN_ERROR':
      return 500
    default:
      return 400
  }
}

/** 将任意工具/API 错误转为与原生 API 一致的错误信封，避免打断整轮 agent run */
export function toToolFailureResult(error: unknown, hints: RecoverableHint[] = []): string {
  const apiMessage = formatApiError(error)
  const matched = matchHint(apiMessage, hints)
  const classified = classifyToolError(error)
  const existingReason =
    typeof error === 'object' &&
    error !== null &&
    typeof (error as Record<string, unknown>).reason === 'string'
      ? ((error as Record<string, unknown>).reason as string)
      : undefined
  const reason = matched?.reason ?? existingReason ?? classified
  const statusReason = reason === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : classified
  const message = `${apiMessage}。${matched?.hint ?? hintForReason(reason)}`

  return JSON.stringify(
    mergeErrorEnvelope(error, {
      code: statusForReason(statusReason, error),
      reason,
      message
    })
  )
}

export function isToolFailureResult(raw: string): boolean {
  try {
    return isToolFailurePayload(JSON.parse(raw) as unknown)
  } catch {
    return false
  }
}

/** schema 校验失败或未捕获异常：转为 ToolMessage 内容交给模型纠偏 */
export function formatUnhandledToolError(error: unknown, toolName: string): string {
  const message = formatApiError(error)
  const reason = classifyToolError(error)
  return JSON.stringify(
    mergeErrorEnvelope(error, {
      code: statusForReason(reason, error),
      reason,
      message: `工具「${toolName}」执行失败：${message}。${hintForReason(reason)}`
    })
  )
}
