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

export function bindGeneratedClient(client: Client): void {
  const generatedRequest = client.request.bind(client)
  client.request = ((options) => {
    const active = runClientStorage.getStore()
    return active ? active.request(options) : generatedRequest(options)
  }) as Client['request']
}
