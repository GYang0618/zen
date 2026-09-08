import { executeApiCall } from '../api'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { RecoverableHint } from '../api/tool-failure'

export {
  formatUnhandledToolError,
  isToolFailureResult,
  toToolFailureResult
} from '../api/tool-failure'

export type { RecoverableHint } from '../api/tool-failure'

/** 将 API 错误转为工具结果（可附带已知业务 hint），避免打断整轮 agent run */
export async function executeApiCallOrRecover<T>(
  config: RunnableConfig | undefined,
  call: Parameters<typeof executeApiCall<T>>[1],
  hints: RecoverableHint[]
): Promise<string> {
  return executeApiCall<T>(config, call, hints)
}
