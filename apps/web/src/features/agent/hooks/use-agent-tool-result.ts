import { useMemo } from 'react'

import { parseAgentToolResult } from '../lib/parse-agent-tool-result'

import type { AgentToolResult, ParseAgentToolResultOptions } from '../lib/parse-agent-tool-result'

/**
 * 解包 Agent 工具返回的 API 信封，得到 data / 成功态 / 错误信息。
 * 必须在 React 组件内调用；`useRenderTool` 的 render 回调请改用子组件，或直接用 {@link parseAgentToolResult}。
 */
export function useAgentToolResult<T = unknown>(
  result: string | undefined,
  options: ParseAgentToolResultOptions<T> = {}
): AgentToolResult<T> {
  const { status, schema } = options
  return useMemo(() => parseAgentToolResult(result, { status, schema }), [result, status, schema])
}
