import { AGENT_APPROVAL_ID_CONFIGURABLE_KEY } from '@zen/shared'

import { getToolExecutionPolicy } from '../tools/policy'
import { client } from './client'
import { getAccessTokenFromConfig, runWithRequestContext } from './request-context'
import {
  createReadFallbackContext,
  readConfigString,
  resolveToolCallIdentity,
  resolveToolExecutionContext
} from './tool-execution-context'
import { classifyToolError, toToolFailureResult } from './tool-failure'
import { isRecord, toErrorEnvelope, toSuccessEnvelope } from './tool-result'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { ToolExecutionContext } from '@zen/shared'
import type { AgentRequestContext } from './request-context'

const ARTIFACT_THRESHOLD_CHARS = 32_000
const RETRY_BASE_DELAY_MS = 300
const DEFAULT_MUTATING_TIMEOUT_MS = 15_000
const DEFAULT_READ_TIMEOUT_MS = 10_000
const UNSPECIFIED_TOOL_NAME = 'unknown_tool'
const ARTIFACT_KIND_TOOL_RESULT = 'tool-result'
const ARTIFACT_MIME_JSON = 'application/json'

const MISSING_CONTEXT_RESULT = JSON.stringify(
  toErrorEnvelope({
    code: 400,
    reason: 'MISSING_EXECUTION_CONTEXT',
    message: '写操作缺少 run/tool/tenant/user 标识，已拒绝执行。'
  })
)

interface ToolResultArtifact {
  id: string
  name: string
  size: number
  summary: string | null
}

/** OpenAPI 未完整生成 body/query 时的调用参数断言 */
export function asSdkOptions<T>(options: object): T {
  return options as T
}

/**
 * 执行 SDK 请求。传输层拦截器负责鉴权头与信封解包；
 * 本函数只处理 Tool 上下文、重试，以及给模型的结果信封。
 */
export async function executeApiCall<T>(
  config: RunnableConfig | undefined,
  call: (context: ToolExecutionContext) => Promise<unknown>
): Promise<string> {
  const { toolName } = resolveToolCallIdentity(config)
  const policy = getToolExecutionPolicy(toolName ?? UNSPECIFIED_TOOL_NAME)
  const mutating = policy !== undefined && policy.sideEffect !== 'none'

  let accessToken: string
  try {
    accessToken = getAccessTokenFromConfig(config)
  } catch (error) {
    return toToolFailureResult(error)
  }

  const resolved = resolveToolExecutionContext(config)
  if (mutating && 'error' in resolved) {
    return MISSING_CONTEXT_RESULT
  }

  const toolContext =
    'context' in resolved ? resolved.context : createReadFallbackContext(config, accessToken)

  const requestContext: Omit<AgentRequestContext, 'signal'> = {
    accessToken,
    runId: toolContext.runId,
    toolName: toolContext.toolName,
    approvalId:
      toolContext.approvalId ?? readConfigString(config, AGENT_APPROVAL_ID_CONFIGURABLE_KEY),
    idempotencyKey:
      policy?.idempotencyPolicy === 'run-tool-call' && mutating
        ? `${toolContext.runId}:${toolContext.toolCallId}`
        : undefined
  }

  const timeoutMs =
    policy?.timeoutMs ?? (mutating ? DEFAULT_MUTATING_TIMEOUT_MS : DEFAULT_READ_TIMEOUT_MS)
  const maxRetries = mutating ? 0 : (policy?.retryPolicy.maxRetries ?? 0)
  const retryableReasons = policy?.retryPolicy.retryableReasons ?? []

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const signal = mergeAbortSignals(config?.signal, AbortSignal.timeout(timeoutMs))
    try {
      return await runWithRequestContext({ ...requestContext, signal }, async () => {
        const body = await call(toolContext)
        return serializeSuccessResult<T>(body, toolContext)
      })
    } catch (error) {
      const retryable = attempt < maxRetries && retryableReasons.includes(classifyToolError(error))
      if (!retryable) return toToolFailureResult(error)
      await delay(RETRY_BASE_DELAY_MS * 2 ** attempt, config?.signal)
    }
  }

  return toToolFailureResult(new Error('Tool retry budget exhausted'))
}

async function serializeSuccessResult<T>(
  body: unknown,
  context: ToolExecutionContext
): Promise<string> {
  const envelope = toSuccessEnvelope<T>(body, context.traceId ?? 'agent-local')
  const serialized = JSON.stringify(envelope)
  if (serialized.length <= ARTIFACT_THRESHOLD_CHARS || !context.runId || !context.toolCallId) {
    return serialized
  }

  const artifact = await persistArtifact({
    runId: context.runId,
    toolCallId: context.toolCallId,
    toolName: context.toolName,
    data: envelope.data
  })
  if (!artifact) return serialized

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

async function persistArtifact(input: {
  runId: string
  toolCallId: string
  toolName: string
  data: unknown
}): Promise<ToolResultArtifact | undefined> {
  try {
    const result: unknown = await client.post({
      url: `/api/copilot/runtime/runs/${encodeURIComponent(input.runId)}/artifacts`,
      body: {
        toolCallId: input.toolCallId,
        kind: ARTIFACT_KIND_TOOL_RESULT,
        name: `${input.toolName}-result.json`,
        mimeType: ARTIFACT_MIME_JSON,
        summary: `${input.toolName} 的完整结果`,
        content: input.data
      }
    })
    return isToolResultArtifact(result) ? result : undefined
  } catch {
    return undefined
  }
}

function isToolResultArtifact(value: unknown): value is ToolResultArtifact {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.size === 'number' &&
    (value.summary === null || typeof value.summary === 'string')
  )
}

function mergeAbortSignals(parent: AbortSignal | undefined, timeout: AbortSignal): AbortSignal {
  return parent ? AbortSignal.any([parent, timeout]) : timeout
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
