import { apiErrorResponseSchema, apiResponseSchema } from '@zen/shared'
import { z } from 'zod'

import type { ApiErrorResponse, ApiResponse } from '@zen/shared'

const successEnvelopeSchema = apiResponseSchema(z.unknown())

export type AgentToolCallStatus = 'inProgress' | 'executing' | 'complete'

export type AgentToolResultPhase = 'idle' | 'pending' | 'success' | 'error' | 'invalid'

export interface AgentToolResult<T = unknown> {
  /** 综合阶段：pending=工具执行中；success/error=信封解析结果；invalid=非预期载荷 */
  phase: AgentToolResultPhase
  /** 是否拿到可用业务 data */
  success: boolean
  /** 业务 data（成功且通过 schema 时） */
  data: T | undefined
  code: number | undefined
  message: string | undefined
  reason: string | null | undefined
  fieldErrors: Record<string, string[]> | null | undefined
  formErrors: string[] | null | undefined
  path: string | undefined
  traceId: string | undefined
  timestamp: string | undefined
  /** 原始解析后的成功/失败信封（便于调试或二次处理） */
  envelope: ApiResponse<unknown> | ApiErrorResponse | undefined
}

export interface ParseAgentToolResultOptions<T> {
  /** CopilotKit tool 执行状态；pending 时不解析 result */
  status?: AgentToolCallStatus
  /** 校验并收窄 envelope.data；省略则 data 为 unknown */
  schema?: z.ZodType<T>
}

function emptyResult<T>(phase: AgentToolResultPhase): AgentToolResult<T> {
  return {
    phase,
    success: false,
    data: undefined,
    code: undefined,
    message: undefined,
    reason: undefined,
    fieldErrors: undefined,
    formErrors: undefined,
    path: undefined,
    traceId: undefined,
    timestamp: undefined,
    envelope: undefined
  }
}

function parseJson(result: string): unknown | undefined {
  try {
    return JSON.parse(result) as unknown
  } catch {
    return undefined
  }
}

function fromSuccessEnvelope<T>(
  envelope: ApiResponse<unknown>,
  schema: z.ZodType<T> | undefined
): AgentToolResult<T> {
  if (schema) {
    const parsed = schema.safeParse(envelope.data)
    if (!parsed.success) {
      return {
        ...emptyResult<T>('invalid'),
        code: envelope.code,
        message: envelope.message,
        traceId: envelope.traceId,
        timestamp: envelope.timestamp,
        envelope
      }
    }
    return {
      phase: 'success',
      success: true,
      data: parsed.data,
      code: envelope.code,
      message: envelope.message,
      reason: undefined,
      fieldErrors: undefined,
      formErrors: undefined,
      path: undefined,
      traceId: envelope.traceId,
      timestamp: envelope.timestamp,
      envelope
    }
  }

  return {
    phase: 'success',
    success: true,
    data: envelope.data as T,
    code: envelope.code,
    message: envelope.message,
    reason: undefined,
    fieldErrors: undefined,
    formErrors: undefined,
    path: undefined,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    envelope
  }
}

function fromErrorEnvelope<T>(envelope: ApiErrorResponse): AgentToolResult<T> {
  return {
    phase: 'error',
    success: false,
    data: undefined,
    code: envelope.code,
    message: envelope.message,
    reason: envelope.reason,
    fieldErrors: envelope.fieldErrors,
    formErrors: envelope.formErrors,
    path: envelope.path,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    envelope
  }
}

/**
 * 解析 Agent 工具返回的原生 API 信封（成功/失败）。
 * 可在 `useRenderTool` 的 render 回调中安全调用（纯函数，非 Hook）。
 */
export function parseAgentToolResult<T = unknown>(
  result: string | undefined,
  options: ParseAgentToolResultOptions<T> = {}
): AgentToolResult<T> {
  const { status, schema } = options

  if (status === 'inProgress' || status === 'executing') {
    return emptyResult<T>('pending')
  }

  if (result === undefined || result.trim() === '') {
    return emptyResult<T>(status === 'complete' ? 'invalid' : 'idle')
  }

  const raw = parseJson(result)
  if (raw === undefined) {
    return emptyResult<T>('invalid')
  }

  const success = successEnvelopeSchema.safeParse(raw)
  if (success.success && success.data.code >= 200 && success.data.code < 400) {
    return fromSuccessEnvelope(success.data, schema)
  }

  const failure = apiErrorResponseSchema.safeParse(raw)
  if (failure.success) {
    return fromErrorEnvelope(failure.data)
  }

  // 宽松兜底：code>=400 且带 message 时视为错误（timestamp 等字段可能不完整）
  if (
    typeof raw === 'object' &&
    raw !== null &&
    typeof (raw as { code?: unknown }).code === 'number' &&
    (raw as { code: number }).code >= 400 &&
    typeof (raw as { message?: unknown }).message === 'string'
  ) {
    const record = raw as Record<string, unknown>
    return {
      phase: 'error',
      success: false,
      data: undefined,
      code: record.code as number,
      message: record.message as string,
      reason: typeof record.reason === 'string' ? record.reason : null,
      fieldErrors:
        record.fieldErrors && typeof record.fieldErrors === 'object'
          ? (record.fieldErrors as Record<string, string[]>)
          : null,
      formErrors: Array.isArray(record.formErrors) ? (record.formErrors as string[]) : null,
      path: typeof record.path === 'string' ? record.path : undefined,
      traceId: typeof record.traceId === 'string' ? record.traceId : undefined,
      timestamp: typeof record.timestamp === 'string' ? record.timestamp : undefined,
      envelope: undefined
    }
  }

  return emptyResult<T>('invalid')
}
