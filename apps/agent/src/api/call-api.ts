import {
  AGENT_APPROVAL_ID_CONFIGURABLE_KEY,
  AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY
} from '@zen/shared'

import { configs } from '../configs/env'
import { getToolExecutionPolicy } from '../tool-policy'
import { createAgentApiClient, runWithAgentApiClient } from './create-client'
import { getAccessTokenFromConfig, runWithAccessToken } from './request-context'
import { resolveToolCallIdentity, resolveToolExecutionContext } from './tool-execution-context'
import { classifyToolError, toToolFailureResult } from './tool-failure'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { ToolExecutionContext } from '@zen/shared'
import type { RecoverableHint } from './tool-failure'

interface ApiSuccessEnvelope<T> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

const ARTIFACT_THRESHOLD_CHARS = 32_000
const MISSING_CONTEXT_RESULT = JSON.stringify({
  success: false,
  reason: 'MISSING_EXECUTION_CONTEXT',
  message: '写操作缺少 run/tool/tenant/user 标识，已拒绝执行。',
  retryable: false
})

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
 * 每次调用创建无状态 API client，写操作在缺少执行标识时 fail closed。
 */
export async function executeApiCall<T>(
  config: RunnableConfig | undefined,
  call: (context: ToolExecutionContext) => Promise<unknown>,
  hints: RecoverableHint[] = []
): Promise<string> {
  const { toolName } = resolveToolCallIdentity(config)
  const policy = getToolExecutionPolicy(toolName ?? 'unknown_tool')
  const mutating = policy !== undefined && policy.sideEffect !== 'none'
  const resolved = resolveToolExecutionContext(config)

  if (mutating && 'error' in resolved) {
    return MISSING_CONTEXT_RESULT
  }

  const accessToken = getAccessTokenFromConfig(config)
  const toolContext: ToolExecutionContext =
    'context' in resolved
      ? resolved.context
      : {
          tenantId: 'unknown',
          userId: 'unknown',
          threadId: 'unknown',
          runId: 'unknown',
          accessToken,
          locale: 'zh-CN',
          permissions: [],
          activePluginIds: [],
          memory: { includeLongTerm: false, maxChars: 6_000 },
          toolName: toolName ?? 'unknown_tool',
          toolCallId: 'unknown',
          abortSignal: config?.signal
        }

  if (mutating) {
    if (
      !toolContext.runId ||
      toolContext.runId === 'unknown' ||
      !toolContext.toolCallId ||
      toolContext.toolCallId === 'unknown' ||
      !toolContext.tenantId ||
      toolContext.tenantId === 'unknown' ||
      !toolContext.userId ||
      toolContext.userId === 'unknown' ||
      !toolContext.toolName ||
      toolContext.toolName === 'unknown_tool'
    ) {
      return MISSING_CONTEXT_RESULT
    }
  }

  const stepUpToken = readStringFromContext(config, AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY)
  const approvalId =
    toolContext.approvalId ?? readStringFromContext(config, AGENT_APPROVAL_ID_CONFIGURABLE_KEY)
  const idempotencyKey =
    policy?.idempotencyPolicy === 'run-tool-call' && mutating
      ? `${toolContext.runId}:${toolContext.toolCallId}`
      : undefined
  const maxRetries = mutating ? 0 : (policy?.retryPolicy.maxRetries ?? 0)
  const apiClient = createAgentApiClient()

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const timeoutSignal = AbortSignal.timeout(policy?.timeoutMs ?? 30_000)
    const signal = config?.signal ? AbortSignal.any([config.signal, timeoutSignal]) : timeoutSignal
    try {
      const body = await runWithAgentApiClient(apiClient, () =>
        runWithAccessToken(
          accessToken,
          () => call(toolContext),
          idempotencyKey,
          signal,
          stepUpToken,
          toolContext.runId,
          toolContext.toolName,
          approvalId
        )
      )
      const data = unwrapApiSuccessData<T>(body)
      const serialized = JSON.stringify(data ?? null)
      if (
        serialized.length > ARTIFACT_THRESHOLD_CHARS &&
        toolContext.runId &&
        toolContext.toolCallId
      ) {
        const artifact = await persistArtifact({
          accessToken,
          runId: toolContext.runId,
          toolCallId: toolContext.toolCallId,
          toolName: toolContext.toolName,
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

function readStringFromContext(
  config: RunnableConfig | undefined,
  key: string
): string | undefined {
  const record = config as {
    configurable?: Record<string, unknown>
    context?: Record<string, unknown>
  }
  const value = record?.configurable?.[key] ?? record?.context?.[key]
  return typeof value === 'string' && value ? value : undefined
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
