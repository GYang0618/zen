import { getAccessTokenFromConfig, runWithAccessToken } from './request-context'
import { toToolFailureResult } from './tool-failure'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { RecoverableHint } from './tool-failure'

interface ApiSuccessEnvelope<T> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

function isApiSuccessEnvelope<T>(value: unknown): value is ApiSuccessEnvelope<T> {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  return 'data' in value && 'code' in value && 'message' in value
}

/** 解包 TransformInterceptor 返回的 { code, message, data, ... } */
export function unwrapApiSuccessData<T>(body: unknown): T {
  if (isApiSuccessEnvelope<T>(body)) {
    return body.data
  }
  return body as T
}

/** OpenAPI 未完整生成 body/query 时的调用参数断言 */
export function asSdkOptions<T>(options: object): T {
  return options as T
}

/** 将「单个或数组」查询参数规范成 SDK 需要的数组 */
export function toQueryArray<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}

/**
 * 执行 SDK 请求并将业务 data 序列化为工具返回值。
 * token 从 RunnableConfig 读取并注入当前异步上下文，无需在各工具 / SDK 调用中重复传入 auth。
 * 业务/网络错误转为 `{ success: false }` JSON，不抛出，以便模型继续纠偏或追问。
 */
export async function executeApiCall<T>(
  config: RunnableConfig | undefined,
  call: () => Promise<unknown>,
  hints: RecoverableHint[] = []
): Promise<string> {
  const accessToken = getAccessTokenFromConfig(config)

  try {
    const body = await runWithAccessToken(accessToken, call)
    const data = unwrapApiSuccessData<T>(body)
    if (data === undefined) {
      return JSON.stringify({ success: true })
    }
    return JSON.stringify(data, null, 2)
  } catch (error) {
    return toToolFailureResult(error, hints)
  }
}
