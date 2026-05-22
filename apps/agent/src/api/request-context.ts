import { AsyncLocalStorage } from 'node:async_hooks'

import { ACCESS_TOKEN_CONFIGURABLE_KEY } from '@zen/shared'

import type { RunnableConfig } from '@langchain/core/runnables'

const accessTokenStorage = new AsyncLocalStorage<string>()

/** 从 LangGraph RunnableConfig 读取当前请求的 access token */
export function getAccessTokenFromConfig(config?: RunnableConfig): string {
  const token = config?.configurable?.[ACCESS_TOKEN_CONFIGURABLE_KEY]

  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('缺少用户 access token，无法调用后端用户 API')
  }

  return token
}

/** 在当前异步上下文中读取 access token（由 executeApiCall 注入） */
export function getCurrentAccessToken(): string {
  const token = accessTokenStorage.getStore()

  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('缺少用户 access token，无法调用后端用户 API')
  }

  return token
}

/** 在指定 token 的异步上下文中执行（供 SDK client.auth 回调使用） */
export function runWithAccessToken<T>(accessToken: string, fn: () => Promise<T>): Promise<T> {
  return accessTokenStorage.run(accessToken, fn)
}
