import type { ApiErrorResponseSwaggerDto } from '../api-client/types.gen'

export type RecoverableHint = {
  match: string
  reason: string
  hint: string
}

export type ToolFailureResult = {
  success: false
  reason: string
  message: string
}

const GENERIC_RETRY_HINT = '请根据错误修正参数后重试；若缺少用户提供的信息，向用户询问后再调用。'

const DEFAULT_FAILURE_REASON = 'TOOL_CALL_FAILED'

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

/** 将任意工具/API 错误转为可回传给模型的 JSON 结果，避免打断整轮 agent run */
export function toToolFailureResult(error: unknown, hints: RecoverableHint[] = []): string {
  const apiMessage = formatApiError(error)
  const matched = matchHint(apiMessage, hints)

  const result: ToolFailureResult = matched
    ? {
        success: false,
        reason: matched.reason,
        message: `${apiMessage}。${matched.hint}`
      }
    : {
        success: false,
        reason: DEFAULT_FAILURE_REASON,
        message: `${apiMessage}。${GENERIC_RETRY_HINT}`
      }

  return JSON.stringify(result)
}

export function isToolFailureResult(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return false
    const record = parsed as Record<string, unknown>
    return record.success === false && typeof record.message === 'string'
  } catch {
    return false
  }
}

/** schema 校验失败或未捕获异常：转为 ToolMessage 内容交给模型纠偏 */
export function formatUnhandledToolError(error: unknown, toolName: string): string {
  const message = formatApiError(error)
  const result: ToolFailureResult = {
    success: false,
    reason: 'TOOL_ERROR',
    message: `工具「${toolName}」执行失败：${message}。${GENERIC_RETRY_HINT}`
  }
  return JSON.stringify(result)
}
