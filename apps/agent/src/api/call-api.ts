import { getAccessTokenFromConfig, runWithAccessToken } from './request-context'
import { AGENT_RUN_ID_CONFIGURABLE_KEY } from '@zen/shared'
import { classifyToolError, toToolFailureResult } from './tool-failure'
import { getToolExecutionPolicy } from '../tool-policy'
import { configs } from '../configs/env'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { RecoverableHint } from './tool-failure'

interface ApiSuccessEnvelope<T> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

const ARTIFACT_THRESHOLD_CHARS = 32_000

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
  const toolConfig = config as
    | (RunnableConfig & {
        toolCallId?: string
        toolCall?: { id?: string; name?: string }
        context?: unknown
        config?: RunnableConfig & { context?: unknown; toolCall?: { id?: string; name?: string } }
      })
    | undefined
  const toolCallId =
    toolConfig?.toolCallId ?? toolConfig?.toolCall?.id ?? toolConfig?.config?.toolCall?.id
  const runId = readStringConfig(toolConfig, AGENT_RUN_ID_CONFIGURABLE_KEY)
  const toolName = toolConfig?.toolCall?.name ?? toolConfig?.config?.toolCall?.name ?? 'unknown_tool'
  const policy = getToolExecutionPolicy(toolName)
  const idempotencyKey =
    policy?.idempotencyPolicy === 'run-tool-call' && toolCallId
      ? `${runId ?? 'agent'}:${toolCallId}`
      : undefined
  const maxRetries = policy?.retryPolicy.maxRetries ?? 0

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const timeoutSignal = AbortSignal.timeout(policy?.timeoutMs ?? 30_000)
    const signal = config?.signal
      ? AbortSignal.any([config.signal, timeoutSignal])
      : timeoutSignal
    try {
      const body = await runWithAccessToken(accessToken, call, idempotencyKey, signal)
      const data = unwrapApiSuccessData<T>(body)
      const serialized = JSON.stringify(data ?? null)
      if (serialized.length > ARTIFACT_THRESHOLD_CHARS && runId && toolCallId) {
        const artifact = await persistArtifact({
          accessToken,
          runId,
          toolCallId,
          toolName,
          data,
          signal
        })
        if (artifact) {
          return JSON.stringify({
            success: true,
            data: {
              artifactId: artifact.id,
              name: artifact.name,
              size: artifact.size,
              summary: artifact.summary,
              message: '结果较大，已保存为 Artifact。'
            }
          })
        }
      }
      return JSON.stringify(data === undefined ? { success: true } : { success: true, data })
    } catch (error) {
      const reason = classifyToolError(error)
      const retryable = policy?.retryPolicy.retryableReasons.includes(reason) === true
      if (attempt < maxRetries && retryable) {
        await delay(300 * 2 ** attempt, config?.signal)
        continue
      }
      return toToolFailureResult(error, hints)
    }
  }

  return toToolFailureResult(new Error('Tool retry budget exhausted'), hints)
}

function readStringConfig(
  config: (RunnableConfig & { context?: unknown; config?: RunnableConfig & { context?: unknown } }) | undefined,
  key: string
): string | undefined {
  for (const candidate of [
    config?.configurable,
    config?.context,
    config?.config?.configurable,
    config?.config?.context
  ]) {
    if (!candidate || typeof candidate !== 'object') continue
    const value = (candidate as Record<string, unknown>)[key]
    if (typeof value === 'string' && value) return value
  }
  return undefined
}

async function persistArtifact(input: {
  accessToken: string
  runId: string
  toolCallId: string
  toolName: string
  data: unknown
  signal: AbortSignal
}): Promise<{ id: string; name: string; size: number; summary: string | null } | undefined> {
  try {
    const response = await fetch(
      `${configs.apiBaseUrl}/api/copilot/runtime/runs/${encodeURIComponent(input.runId)}/artifacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolCallId: input.toolCallId,
          kind: 'tool-result',
          name: `${input.toolName}-result.json`,
          mimeType: 'application/json',
          summary: `${input.toolName} 的完整结果`,
          content: input.data
        }),
        signal: input.signal
      }
    )
    if (!response.ok) return undefined
    return unwrapApiSuccessData(await response.json())
  } catch {
    return undefined
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(signal.reason)
      },
      { once: true }
    )
  })
}
