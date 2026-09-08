import { AsyncLocalStorage } from 'node:async_hooks'

import { ACCESS_TOKEN_CONFIGURABLE_KEY } from '@zen/shared'

import type { RunnableConfig } from '@langchain/core/runnables'

interface AgentRequestContext {
  accessToken: string
  idempotencyKey?: string
  stepUpToken?: string
  runId?: string
  toolName?: string
  approvalId?: string
  signal?: AbortSignal
}

const requestContextStorage = new AsyncLocalStorage<AgentRequestContext>()

/** LangGraph / ToolNode 注入的运行时 config（含 context） */
type AgentRunnableConfig = RunnableConfig & {
  context?: unknown
  config?: RunnableConfig & { context?: unknown }
}

function readAccessTokenFromRecord(record: unknown): string | undefined {
  if (typeof record !== 'object' || record === null) {
    return undefined
  }

  const token = (record as Record<string, unknown>)[ACCESS_TOKEN_CONFIGURABLE_KEY]
  return typeof token === 'string' && token.trim() !== '' ? token : undefined
}

/**
 * 从 LangGraph RunnableConfig 读取当前请求的 access token。
 * CopilotKit 通过 assistantConfig.configurable 注入；LangGraph 运行时常将其合并到 context。
 */
export function getAccessTokenFromConfig(config?: RunnableConfig): string {
  const toolConfig = config as AgentRunnableConfig | undefined

  const token =
    readAccessTokenFromRecord(toolConfig?.configurable) ??
    readAccessTokenFromRecord(toolConfig?.context) ??
    readAccessTokenFromRecord(toolConfig?.config?.configurable) ??
    readAccessTokenFromRecord(toolConfig?.config?.context)

  if (!token) {
    throw new Error('缺少用户 access token，无法调用后端用户 API')
  }

  return token
}

/** 在当前异步上下文中读取 access token（由 executeApiCall 注入） */
export function getCurrentAccessToken(): string {
  const token = requestContextStorage.getStore()?.accessToken

  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('缺少用户 access token，无法调用后端用户 API')
  }

  return token
}

export function getCurrentIdempotencyKey(): string | undefined {
  return requestContextStorage.getStore()?.idempotencyKey
}

export function getCurrentAbortSignal(): AbortSignal | undefined {
  return requestContextStorage.getStore()?.signal
}

export function getCurrentStepUpToken(): string | undefined {
  const token = requestContextStorage.getStore()?.stepUpToken
  return typeof token === 'string' && token.trim() !== '' ? token : undefined
}

export function getCurrentRunId(): string | undefined {
  return requestContextStorage.getStore()?.runId
}

export function getCurrentToolName(): string | undefined {
  return requestContextStorage.getStore()?.toolName
}

export function getCurrentApprovalId(): string | undefined {
  return requestContextStorage.getStore()?.approvalId
}

/** 在指定 token 的异步上下文中执行（供 SDK client.auth 回调使用） */
export function runWithAccessToken<T>(
  accessToken: string,
  fn: () => Promise<T>,
  idempotencyKey?: string,
  signal?: AbortSignal,
  stepUpToken?: string,
  runId?: string,
  toolName?: string,
  approvalId?: string
): Promise<T> {
  return requestContextStorage.run(
    { accessToken, idempotencyKey, signal, stepUpToken, runId, toolName, approvalId },
    fn
  )
}
