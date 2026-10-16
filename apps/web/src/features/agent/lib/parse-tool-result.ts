import type { z } from 'zod'

interface ToolCallResult<T = unknown> {
  code: number
  message: string
  data: T
}

/**
 * 解包 Agent 工具返回的 API 成功信封，并用 schema 校验 data。
 * `result` 可为 JSON 字符串或已解析对象（CopilotKit 两种形态均可能出现）。
 */
export function parseToolResult<S extends z.ZodType>(
  result: string | object | undefined,
  schema: S
): z.output<S> | null {
  const parsed = parseRawJson(result)
  if (!parsed) return null

  const parsedData = schema.safeParse(parsed.data)
  if (!parsedData.success) return null

  return parsedData.data
}

function parseRawJson<T = unknown>(result: string | object | undefined): ToolCallResult<T> | null {
  if (result === undefined) return null

  let res: unknown
  if (typeof result === 'string') {
    if (result.trim() === '') return null
    try {
      res = JSON.parse(result) as unknown
    } catch {
      return null
    }
  } else {
    res = result
  }

  if (
    typeof res === 'object' &&
    res !== null &&
    'code' in res &&
    'message' in res &&
    'data' in res
  ) {
    return res as ToolCallResult<T>
  }

  return null
}
