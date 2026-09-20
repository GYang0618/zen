import { AsyncLocalStorage } from 'node:async_hooks'

import { ACCESS_TOKEN_CONFIGURABLE_KEY } from '@zen/shared'

import { readConfigString } from './tool-execution-context'

import type { RunnableConfig } from '@langchain/core/runnables'

export interface AgentRequestContext {
  accessToken: string
  idempotencyKey?: string
  stepUpToken?: string
  runId?: string
  toolName?: string
  approvalId?: string
  signal?: AbortSignal
}

const requestContextStorage = new AsyncLocalStorage<AgentRequestContext>()

export class UnauthorizedToolError extends Error {
  readonly status = 401
  readonly code = 401
  readonly reason = 'UNAUTHORIZED' as const

  constructor(message = '缺少用户 access token，无法调用后端用户 API') {
    super(message)
    this.name = 'UnauthorizedToolError'
  }
}

/**
 * 从 LangGraph RunnableConfig 读取当前请求的 access token。
 * CopilotKit 通过 assistantConfig.configurable 注入；LangGraph 运行时常将其合并到 context。
 */
export function getAccessTokenFromConfig(config?: RunnableConfig): string {
  const token = readConfigString(config, ACCESS_TOKEN_CONFIGURABLE_KEY)
  if (!token) throw new UnauthorizedToolError()
  return token
}

export function getCurrentRequestContext(): AgentRequestContext | undefined {
  return requestContextStorage.getStore()
}

/** 在当前异步上下文中读取 access token（由 executeApiCall 注入，供 SDK auth 回调使用） */
export function getCurrentAccessToken(): string {
  const token = getCurrentRequestContext()?.accessToken
  if (typeof token !== 'string' || token.trim() === '') {
    throw new UnauthorizedToolError()
  }
  return token
}

/** 在指定请求上下文中执行 SDK 调用 */
export function runWithRequestContext<T>(
  context: AgentRequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return requestContextStorage.run(context, fn)
}
