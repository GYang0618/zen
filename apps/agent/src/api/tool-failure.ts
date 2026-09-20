import { isRecord, isToolFailurePayload, mergeErrorEnvelope } from './tool-result'

import type { ApiErrorResponseSwaggerDto } from '../api-client/types.gen'
import type { ApiErrorEnvelope } from './tool-result'

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

function errorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined
  if (typeof error.status === 'number') return error.status
  // The generated OpenAPI client throws the parsed API error envelope directly.
  // Its HTTP status is exposed as the top-level numeric `code` field.
  if (typeof error.code === 'number') return error.code
  const response = error.response
  if (isRecord(response) && typeof response.status === 'number') {
    return response.status
  }
  return undefined
}

function readMessageField(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value.trim()
  if (Array.isArray(value)) {
    const parts = value
      .map(String)
      .map((part) => part.trim())
      .filter(Boolean)
    if (parts.length > 0) return parts.join('；')
  }
  return undefined
}

function formatFieldErrors(fieldErrors: Record<string, unknown>): string | undefined {
  const parts: string[] = []
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (!Array.isArray(messages) || messages.length === 0) continue
    const text = messages
      .map(String)
      .map((part) => part.trim())
      .filter(Boolean)
      .join('；')
    if (text) parts.push(`${field}: ${text}`)
  }
  return parts.length > 0 ? parts.join('；') : undefined
}

function formatValidationDetails(record: Record<string, unknown>): string | undefined {
  const parts: string[] = []
  if (isRecord(record.fieldErrors)) {
    const fieldText = formatFieldErrors(record.fieldErrors)
    if (fieldText) parts.push(fieldText)
  }
  if (Array.isArray(record.formErrors)) {
    const formText = record.formErrors
      .map(String)
      .map((part) => part.trim())
      .filter(Boolean)
      .join('；')
    if (formText) parts.push(formText)
  }
  return parts.length > 0 ? parts.join('；') : undefined
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

  const record = isRecord(error) ? error : undefined
  const code = typeof record?.code === 'string' ? record.code : ''
  const message = formatApiError(error).toLowerCase()
  if (
    code === 'ABORT_ERR' ||
    code === 'ETIMEDOUT' ||
    message.includes('timeout') ||
    message.includes('超时') ||
    message.includes('timed out')
  ) {
    return 'TIMEOUT'
  }
  if (
    ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT'].includes(
      code
    ) ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('连接失败') ||
    message.includes('连接拒绝') ||
    message.includes('网络')
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

const GENERIC_VALIDATION_MESSAGES = new Set([
  '参数验证失败',
  'Bad Request',
  'Validation failed',
  '请求错误'
])

/** 从 API / SDK 错误体提取可读 message（含 message 数组与校验明细） */
export function formatApiError(error: unknown): string {
  if (isRecord(error)) {
    const nested = error.error
    const candidates = [
      readMessageField(error.message),
      readMessageField(error.messages),
      isRecord(nested)
        ? readMessageField((nested as ApiErrorResponseSwaggerDto).message)
        : undefined
    ]
    const baseMessage = candidates.find((value) => value !== undefined)
    const details = formatValidationDetails(error)

    if (baseMessage && details && GENERIC_VALIDATION_MESSAGES.has(baseMessage)) {
      return `${baseMessage}（${details}）`
    }
    if (baseMessage) return baseMessage
    if (details) return details
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
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

function resolveFailureReason(error: unknown): string {
  if (isRecord(error) && typeof error.reason === 'string' && error.reason.trim() !== '') {
    return error.reason
  }
  return classifyToolError(error)
}

/** 将任意工具/API 错误转为与原生 API 一致的错误信封，避免打断整轮 agent run */
export function toToolFailureResult(error: unknown): string {
  const reason = resolveFailureReason(error)
  const classified = classifyToolError(error)
  const statusReason = reason === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : classified

  return JSON.stringify(
    mergeErrorEnvelope(error, {
      code: statusForReason(statusReason, error),
      reason,
      message: formatApiError(error)
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
      message: `工具「${toolName}」执行失败：${message}`
    })
  )
}
