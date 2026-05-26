import { getAccessTokenFromConfig, runWithAccessToken } from './request-context'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { ApiErrorResponseSwaggerDto } from '../api-client/types.gen'

interface ApiSuccessEnvelope<T> {
  code: number
  message: string
  data: T
  requestId: string | null
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

function formatApiError(error: unknown): string {
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

/**
 * 执行 SDK 请求并将业务 data 序列化为工具返回值。
 * token 从 RunnableConfig 读取并注入当前异步上下文，无需在各工具 / SDK 调用中重复传入 auth。
 */
export async function executeApiCall<T>(
  config: RunnableConfig | undefined,
  call: () => Promise<unknown>
): Promise<string> {
  const accessToken = getAccessTokenFromConfig(config)

  try {
    const body = await runWithAccessToken(accessToken, call)
    return JSON.stringify(unwrapApiSuccessData<T>(body), null, 2)
  } catch (error) {
    throw new Error(`API 调用失败: ${formatApiError(error)}`)
  }
}
