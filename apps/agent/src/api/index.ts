import { createClient } from '../api-client/client'
import { client } from '../api-client/client.gen'
import { bindGeneratedClient } from './create-client'

export * from '../api-client'
export { asSdkOptions, executeApiCall, toQueryArray, unwrapApiSuccessData } from './call-api'
export {
  createAgentApiClient,
  getActiveAgentApiClient,
  runWithAgentApiClient
} from './create-client'
export { getAccessTokenFromConfig, getCurrentAccessToken } from './request-context'
export { resolveToolExecutionContext } from './tool-execution-context'
export {
  formatUnhandledToolError,
  isToolFailureResult,
  type RecoverableHint,
  toToolFailureResult
} from './tool-failure'

export { client, createClient }

bindGeneratedClient(client)
