import { createClient } from '../api-client/client'
import { client } from './client'

export * from '../api-client'
export { asSdkOptions, executeApiCall } from './call-api'
export {
  getAccessTokenFromConfig,
  getCurrentAccessToken,
  UnauthorizedToolError
} from './request-context'
export {
  resolveToolCallIdentity,
  resolveToolExecutionContext
} from './tool-execution-context'
export {
  formatUnhandledToolError,
  isToolFailureResult,
  toToolFailureResult
} from './tool-failure'
export {
  isApiErrorEnvelope,
  isApiSuccessEnvelope,
  toErrorEnvelope,
  toSuccessEnvelope,
  unwrapToolSuccessData
} from './tool-result'

export { client, createClient }
