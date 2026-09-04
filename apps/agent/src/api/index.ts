import { createClient } from '../api-client/client'
import { client } from '../api-client/client.gen'
import { configs } from '../configs/env'
import {
  getCurrentAbortSignal,
  getCurrentAccessToken,
  getCurrentIdempotencyKey,
  getCurrentStepUpToken
} from './request-context'

export * from '../api-client'
export { asSdkOptions, executeApiCall, toQueryArray, unwrapApiSuccessData } from './call-api'
export { getAccessTokenFromConfig, getCurrentAccessToken } from './request-context'
export {
  formatUnhandledToolError,
  isToolFailureResult,
  type RecoverableHint,
  toToolFailureResult
} from './tool-failure'

export { client, createClient }

client.setConfig({
  baseUrl: configs.apiBaseUrl,
  responseStyle: 'data',
  throwOnError: true,
  auth: getCurrentAccessToken
})

client.interceptors.request.use((request) => {
  const idempotencyKey = getCurrentIdempotencyKey()
  const stepUpToken = getCurrentStepUpToken()
  const headers = new Headers(request.headers)
  if (idempotencyKey) headers.set('x-agent-idempotency-key', idempotencyKey)
  if (stepUpToken) headers.set('x-step-up-token', stepUpToken)
  return new Request(request, { headers, signal: getCurrentAbortSignal() ?? request.signal })
})
