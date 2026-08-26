import { createClient } from '../api-client/client'
import { client } from '../api-client/client.gen'
import { configs } from '../configs/env'
import { getCurrentAccessToken } from './request-context'

export * from '../api-client'
export { asSdkOptions, executeApiCall, toQueryArray, unwrapApiSuccessData } from './call-api'
export { getAccessTokenFromConfig, getCurrentAccessToken } from './request-context'

export { client, createClient }

client.setConfig({
  baseUrl: configs.apiBaseUrl,
  responseStyle: 'data',
  throwOnError: true,
  auth: getCurrentAccessToken
})
