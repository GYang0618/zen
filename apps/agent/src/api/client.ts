import { client } from '../api-client/client.gen'
import { configs } from '../configs/env'
import {
  normalizeErrorMiddleware,
  unwrapEnvelopeMiddleware,
  withAgentContextMiddleware
} from './middleware'
import { getCurrentAccessToken } from './request-context'

let configured = false

/**
 * 配置生成 SDK 单例：与 web `createHttpClient({ middlewares })` 同构。
 * 拦截器读 ALS，无跨请求可变状态，不必每次 Tool 调用新建 client。
 */
export function configureAgentApiClient(): void {
  if (configured) return
  configured = true

  client.setConfig({
    baseUrl: configs.apiBaseUrl,
    responseStyle: 'data',
    throwOnError: true,
    auth: getCurrentAccessToken
  })

  client.interceptors.request.use(withAgentContextMiddleware)
  client.interceptors.response.use(unwrapEnvelopeMiddleware)
  client.interceptors.error.use(normalizeErrorMiddleware)
}

configureAgentApiClient()

export { client }
