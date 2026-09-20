import type { z } from 'zod'

export interface ParseAgentResultOptions<T> {
  /** 可选的 Zod Schema，用于对解包后的数据进行强类型验证与收窄 */
  schema?: z.ZodType<T>
  /** 可选的工具调用状态，如 'inProgress' | 'executing' | 'complete' */
  status?: string
}

export interface ParseAgentResultSuccess<T> {
  success: true
  data: T
  code: number
  message?: string
  raw?: unknown
}

export interface ParseAgentResultError {
  success: false
  data?: undefined
  code?: number
  message: string
  reason?: string | null
  error?: unknown
  raw?: unknown
}

export type ParsedAgentResult<T> = ParseAgentResultSuccess<T> | ParseAgentResultError

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseRawJson(input: unknown): unknown {
  if (typeof input !== 'string') return input
  const trimmed = input.trim()
  if (trimmed === '') return undefined
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return undefined
  }
}

function formatZodError(error: z.ZodError): string {
  if (!error.issues || error.issues.length === 0) return '数据结构校验不匹配'

  const collectIssues = (err: z.ZodError): string[] => {
    return err.issues.flatMap((issue) => {
      if (
        'unionErrors' in issue &&
        Array.isArray((issue as unknown as { unionErrors: z.ZodError[] }).unionErrors)
      ) {
        const nested = (issue as unknown as { unionErrors: z.ZodError[] }).unionErrors.flatMap(collectIssues)
        if (nested.length > 0) return nested
      }
      const path = issue.path.join('.')
      return [path ? `${path}: ${issue.message}` : issue.message]
    })
  }

  const messages = Array.from(new Set(collectIssues(error).filter((m) => m !== 'Invalid input')))
  if (messages.length === 0) return '数据结构校验不匹配'
  return messages.slice(0, 3).join('; ')
}

/**
 * 统一解析 Agent 工具执行结果 (Tool Call Result)
 *
 * 1. 支持传入 JSON 字符串或已反序列化的对象
 * 2. 根据 `code`（2xx/3xx 为成功，4xx/5xx 为错误）判断接口成功与否
 * 3. 成功时解包信封中的 `data` 并通过传入的 Zod Schema 进行强类型校验
 * 4. 失败或校验不通过时返回统一的错误信息与上下文
 */
export function parseAgentResult<T = unknown>(
  result: unknown,
  options: ParseAgentResultOptions<T> = {}
): ParsedAgentResult<T> {
  const { schema, status } = options

  // 1. 如果调用处于中间状态，尚未产出最终结果
  if (status === 'inProgress' || status === 'executing') {
    return {
      success: false,
      message: '正在处理中...',
      raw: result
    }
  }

  // 2. 尝试反序列化
  const raw = parseRawJson(result)
  if (raw === undefined || raw === null) {
    return {
      success: false,
      message: status === 'complete' ? '工具未返回有效数据' : '等待工具执行...',
      raw: result
    }
  }

  // 3. 提取信封元数据（code, message, reason）
  const record = isRecord(raw) ? raw : undefined
  const code = typeof record?.code === 'number' ? record.code : undefined
  const message = typeof record?.message === 'string' ? record.message : undefined
  const reason = typeof record?.reason === 'string' ? record.reason : null

  // 4. 根据 code 或结构判断是否为错误
  const isErrorCode = code !== undefined && (code < 200 || code >= 400)
  const isExplicitFailure = record?.success === false

  if (isErrorCode || isExplicitFailure) {
    return {
      success: false,
      code: code ?? 400,
      message: message ?? (reason ? `操作失败（${reason}）` : '工具执行失败'),
      reason,
      error: record?.error,
      raw
    }
  }

  // 5. 提取业务载荷（若有 data 字段则解包 data，否则使用整体对象）
  const payload = record && 'data' in record ? record.data : raw

  // 6. 使用 Zod 进行校验
  if (schema) {
    const parseResult = schema.safeParse(payload)
    if (!parseResult.success) {
      return {
        success: false,
        code: code ?? 200,
        message: `数据校验失败: ${formatZodError(parseResult.error)}`,
        reason: 'SCHEMA_VALIDATION_ERROR',
        error: parseResult.error,
        raw
      }
    }
    return {
      success: true,
      data: parseResult.data,
      code: code ?? 200,
      message,
      raw
    }
  }

  // 7. 无 schema 时直接返回解包后数据
  return {
    success: true,
    data: payload as T,
    code: code ?? 200,
    message,
    raw
  }
}
