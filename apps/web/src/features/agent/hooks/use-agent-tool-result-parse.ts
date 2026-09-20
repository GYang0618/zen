import { useMemo } from 'react'

import { parseAgentResult } from '../lib/parse-agent-result'

import type { z } from 'zod'

export interface UseAgentToolResultParseReturn<T> {
  /** 提取并由 Zod 解析/收窄后的真实业务数据；失败或尚未完成时为 undefined */
  data: T | undefined
  /** 解析过程中出现的校验错误，或接口返回的错误信息（message）；成功或尚未完成时为 undefined */
  error: string | undefined
}

/**
 * 统一在前端通过 Hook 解包 Agent 工具调用返回的真实业务数据
 *
 * 核心特性：
 * 1. 自动等待 Agent 状态完成（仅在 result 存在且非空时才执行解包与解析，无需手动传入 status）。
 * 2. 自动兼容原生 JSON 字符串或已解析的对象结构。
 * 3. 拦截 code >= 400 等失败信封，将错误原因/消息提取到 `error`。
 * 4. 成功时解包信封 `data` 并根据传入的 Zod schema 进行强类型校验：
 *    - 校验通过：返回真实业务数据 `data`，`error` 为 undefined；
 *    - 校验失败：返回 `error` 提示信息，`data` 为 undefined。
 *
 * @example
 * ```tsx
 * const { data, error } = useAgentToolResultParse(result, userListResultSchema)
 * ```
 */
export function useAgentToolResultParse<T = unknown>(
  result: unknown,
  schema?: z.ZodType<T>
): UseAgentToolResultParseReturn<T> {
  return useMemo(() => {
    // 尚未产生结果时（执行中或未触发），不予解析并保持静默
    if (result === undefined || result === null || result === '') {
      return {
        data: undefined,
        error: undefined
      }
    }

    const parsed = parseAgentResult<T>(result, { schema })

    if (parsed.success) {
      return {
        data: parsed.data,
        error: undefined
      }
    }

    return {
      data: undefined,
      error: parsed.message || '工具调用失败'
    }
  }, [result, schema])
}
