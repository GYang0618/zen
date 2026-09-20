import {
  AGENT_APPROVAL_ID_CONFIGURABLE_KEY,
  AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY
} from '@zen/shared'

import { configs } from '../configs/env'
import { getToolExecutionPolicy } from '../tools/policy'
import { createAgentApiClient, runWithAgentApiClient } from './create-client'
import { getAccessTokenFromConfig, runWithAccessToken } from './request-context'
import { resolveToolCallIdentity, resolveToolExecutionContext } from './tool-execution-context'
import { classifyToolError, toToolFailureResult } from './tool-failure'
import { isApiSuccessEnvelope, toErrorEnvelope, toSuccessEnvelope } from './tool-result'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { ToolExecutionContext } from '@zen/shared'
import type { RecoverableHint } from './tool-failure'

export {
  type ApiEnvelope,
  type ApiErrorEnvelope,
  type ApiSuccessEnvelope,
  isApiErrorEnvelope,
  isApiSuccessEnvelope,
  isToolFailurePayload,
  toErrorEnvelope,
  toSuccessEnvelope,
  unwrapToolSuccessData
} from './tool-result'

const ARTIFACT_THRESHOLD_CHARS = 32_000
const MISSING_CONTEXT_RESULT = JSON.stringify(
  toErrorEnvelope({
    code: 400,
    reason: 'MISSING_EXECUTION_CONTEXT',
    message: '写操作缺少 run/tool/tenant/user 标识，已拒绝执行。'
  })
)

/** hey-api client 在 throwOnError=false 时返回的 { error } 失败体 */
function isSdkFieldsErrorResult(value: unknown): value is { error: unknown } {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return 'error' in record && record.error !== undefined && !('code' in record)
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

/** 响应拦截器（对齐 web 的 dataTransformMiddleware）：成功响应统一为 { code, message, data } 信封 */
async function transformSuccessResponse<T>(
  body: unknown,
  context: {
    accessToken: string
    runId: string
    toolCallId: string
    toolName: string
    signal: AbortSignal
  }
): Promise<string> {
  const envelope = toSuccessEnvelope<T>(body)
  const serialized = JSON.stringify(envelope)
  if (serialized.length > ARTIFACT_THRESHOLD_CHARS && context.runId && context.toolCallId) {
    const artifact = await persistArtifact({
      accessToken: context.accessToken,
      runId: context.runId,
      toolCallId: context.toolCallId,
      toolName: context.toolName,
      data: envelope.data,
      signal: context.signal
    })
    if (artifact) {
      return JSON.stringify(
        toSuccessEnvelope(
          {
            artifactId: artifact.id,
            name: artifact.name,
            size: artifact.size,
            summary: artifact.summary,
            message: '结果较大，已保存为 Artifact。'
          },
          envelope.traceId
        )
      )
    }
  }
  return serialized
}

/** 错误拦截器（对齐 web 的 globalErrorMiddleware）：失败响应统一为 { code, message, data: null } 信封 */
function transformErrorResponse(error: unknown, hints: RecoverableHint[]): string {
  return toToolFailureResult(error, hints)
}

/**
 * 执行 SDK 请求，并经响应/错误拦截器统一序列化为一致信封：
 * 成功 { code, message, data, traceId, timestamp }（data 为真实业务数据）；
 * 失败 { code, reason, message, data: null, path, traceId, timestamp, ... }。
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

  let accessToken: string
  try {
    accessToken = getAccessTokenFromConfig(config)
  } catch (error) {
    return transformErrorResponse(error, hints)
  }
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

  const defaultTimeout = mutating ? 15_000 : 10_000
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const timeoutSignal = AbortSignal.timeout(policy?.timeoutMs ?? defaultTimeout)
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
      // hey-api fields 风格失败体：{ error }（throwOnError=false 时）。不得当成业务成功。
      if (isSdkFieldsErrorResult(body)) {
        return transformErrorResponse(body.error, hints)
      }
      return await transformSuccessResponse<T>(body, {
        accessToken,
        runId: toolContext.runId,
        toolCallId: toolContext.toolCallId,
        toolName: toolContext.toolName,
        signal
      })
    } catch (error) {
      const reason = classifyToolError(error)
      const retryable = policy?.retryPolicy.retryableReasons.includes(reason) === true
      if (attempt < maxRetries && retryable) {
        await delay(300 * 2 ** attempt, config?.signal)
        continue
      }
      return transformErrorResponse(error, hints)
    }
  }

  return transformErrorResponse(new Error('Tool retry budget exhausted'), hints)
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
