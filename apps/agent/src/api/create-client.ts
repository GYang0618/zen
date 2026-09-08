import { AsyncLocalStorage } from 'node:async_hooks'

import { createClient } from '../api-client/client'
import { configs } from '../configs/env'
import {
  getCurrentAbortSignal,
  getCurrentAccessToken,
  getCurrentApprovalId,
  getCurrentIdempotencyKey,
  getCurrentRunId,
  getCurrentStepUpToken,
  getCurrentToolName
} from './request-context'

import type { Client } from '../api-client/client'

const runClientStorage = new AsyncLocalStorage<Client>()

/** 每次 Tool 执行创建无状态 API client，避免跨请求共享拦截器状态。 */
export function createAgentApiClient(): Client {
  const apiClient = createClient({
    baseUrl: configs.apiBaseUrl,
    responseStyle: 'data',
    throwOnError: true,
    auth: getCurrentAccessToken
  })

  apiClient.interceptors.request.use((request) => {
    const idempotencyKey = getCurrentIdempotencyKey()
    const stepUpToken = getCurrentStepUpToken()
    const runId = getCurrentRunId()
    const toolName = getCurrentToolName()
    const approvalId = getCurrentApprovalId()
    const headers = new Headers(request.headers)
    if (idempotencyKey) headers.set('x-agent-idempotency-key', idempotencyKey)
    if (stepUpToken) headers.set('x-step-up-token', stepUpToken)
    if (runId) headers.set('x-agent-run-id', runId)
    if (toolName) headers.set('x-agent-tool-name', toolName)
    if (approvalId) headers.set('x-agent-approval-id', approvalId)
    return new Request(request, { headers, signal: getCurrentAbortSignal() ?? request.signal })
  })

  return apiClient
}

export function runWithAgentApiClient<T>(apiClient: Client, fn: () => Promise<T>): Promise<T> {
  return runClientStorage.run(apiClient, fn)
}

export function getActiveAgentApiClient(): Client | undefined {
  return runClientStorage.getStore()
}

const CLIENT_HTTP_METHODS = [
  'request',
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'connect',
  'trace'
] as const satisfies ReadonlyArray<keyof Client>

/**
 * 将生成 SDK 的单例 client 方法代理到当前 ALS 中的 agent client。
 * hey-api 的 get/post 等方法在 createClient 时闭包绑定了原始 request，
 * 只替换 client.request 不会生效，必须一并代理各 HTTP method。
 */
export function bindGeneratedClient(client: Client): void {
  for (const method of CLIENT_HTTP_METHODS) {
    const original = client[method].bind(client) as Client[typeof method]
    Object.assign(client, {
      [method]: ((options: never) => {
        const active = runClientStorage.getStore()
        const target = active?.[method] ?? original
        return (target as (opts: never) => unknown)(options)
      }) as Client[typeof method]
    })
  }
}
