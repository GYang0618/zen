/** 与 Nest TransformInterceptor / AllExceptionsFilter 对齐的工具结果信封 */

/**
 * 统一响应信封：成功与失败共用 `code` / `message` / `data` 三字段。
 * 成功时 `data` 为真实业务数据；失败时 `data` 恒为 `null`。
 */
export interface ApiEnvelope<T = unknown> {
  code: number
  message: string
  data: T | null
}

export interface ApiSuccessEnvelope<T = unknown> extends ApiEnvelope<T> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

export interface ApiErrorEnvelope extends ApiEnvelope<null> {
  code: number
  reason: string | null
  message: string
  data: null
  path: string
  traceId: string
  timestamp: string
  error: unknown | null
  fieldErrors: Record<string, string[]> | null
  formErrors: string[] | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isApiSuccessEnvelope<T = unknown>(value: unknown): value is ApiSuccessEnvelope<T> {
  if (!isRecord(value)) return false
  return (
    typeof value.code === 'number' &&
    value.code >= 200 &&
    value.code < 400 &&
    typeof value.message === 'string' &&
    'data' in value
  )
}

export function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!isRecord(value)) return false
  return (
    typeof value.code === 'number' &&
    value.code >= 400 &&
    typeof value.message === 'string' &&
    'reason' in value
  )
}

/** 兼容旧版 { success: false } 与原生 API 错误体 */
export function isToolFailurePayload(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (value.success === false && typeof value.message === 'string') return true
  return isApiErrorEnvelope(value)
}

export function unwrapToolSuccessData(raw: string): unknown | undefined {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isApiSuccessEnvelope(parsed)) return parsed.data
    if (isRecord(parsed) && parsed.success === true) return parsed.data
    return undefined
  } catch {
    return undefined
  }
}

export function toSuccessEnvelope<T>(
  body: unknown,
  fallbackTraceId = 'agent-local'
): ApiSuccessEnvelope<T> {
  if (isApiSuccessEnvelope<T>(body)) return body
  return {
    code: 200,
    message: 'Success',
    data: body as T,
    traceId: fallbackTraceId,
    timestamp: new Date().toISOString()
  }
}

export function toErrorEnvelope(input: {
  code?: number
  reason: string
  message: string
  path?: string
  traceId?: string
  fieldErrors?: Record<string, string[]> | null
  formErrors?: string[] | null
  error?: unknown | null
}): ApiErrorEnvelope {
  return {
    code: input.code ?? 400,
    reason: input.reason,
    message: input.message,
    data: null,
    path: input.path ?? '',
    traceId: input.traceId ?? 'agent-local',
    timestamp: new Date().toISOString(),
    error: input.error ?? null,
    fieldErrors: input.fieldErrors ?? null,
    formErrors: input.formErrors ?? null
  }
}

/** 若 thrown 已是 API 错误体则复用字段，并允许覆盖 reason/message */
export function mergeErrorEnvelope(
  error: unknown,
  overrides: { reason: string; message: string; code?: number }
): ApiErrorEnvelope {
  if (isApiErrorEnvelope(error)) {
    return {
      ...error,
      code: overrides.code ?? error.code,
      reason: overrides.reason,
      message: overrides.message,
      data: null
    }
  }

  const record = isRecord(error) ? error : undefined
  const code =
    overrides.code ??
    (typeof record?.code === 'number' ? record.code : undefined) ??
    (typeof record?.status === 'number' ? record.status : undefined) ??
    500

  return toErrorEnvelope({
    code: code >= 400 ? code : 500,
    reason: overrides.reason,
    message: overrides.message,
    path: typeof record?.path === 'string' ? record.path : '',
    traceId: typeof record?.traceId === 'string' ? record.traceId : 'agent-local',
    fieldErrors:
      isRecord(record?.fieldErrors) && record.fieldErrors !== null
        ? (record.fieldErrors as Record<string, string[]>)
        : null,
    formErrors: Array.isArray(record?.formErrors) ? (record.formErrors as string[]) : null,
    error: null
  })
}
