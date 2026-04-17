import {
  createErrorMiddleware,
  createRequestMiddleware,
  createResponseMiddleware
} from '@zen/request'

import { ApiClientError } from './types'
import { buildFallback, fallbackMessage, isRequestErrorResponse } from './utils'

import type { RequestErrorResponse, RequestResponse } from './types'

// ─── 请求中间件 ───────────────────────────────────────────

/** 注入 Bearer Token（从 localStorage 读取） */
export const withTokenMiddleware = createRequestMiddleware((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// ─── 响应中间件 ───────────────────────────────────────────

/**
 * 数据解包中间件
 * server 的成功响应结构: { code, message, data, requestId, timestamp }
 * 提取 data 字段，避免调用方每次手动访问 response.data.data
 */
export const dataTransformMiddleware = createResponseMiddleware((response) => {
  const body = response.data as RequestResponse<unknown>
  if (body && typeof body === 'object' && 'data' in body) {
    return { ...response, data: body.data }
  }
  return response
})

// ─── 错误中间件 ───────────────────────────────────────────

/**
 * 将 AxiosError 中的 server ApiErrorResponse 解析并转为 ApiClientError
 * 按 server 实际抛出的 HTTP 状态码精细化处理：
 */
export const globalErrorMiddleware = createErrorMiddleware((error) => {
  const status = error.response?.status
  const data = error.response?.data as RequestErrorResponse | undefined

  // 401：token 失效，清空登录状态并跳转登录页
  if (status === 401 && !error.config?.url?.includes('/auth/login')) {
    localStorage.removeItem('token')
    // window.location.assign('/auth/login')
    return Promise.reject(
      new ApiClientError(data ?? buildFallback(status, '登录已过期，请重新登录'))
    )
  }

  // server 返回了结构化的 RequestErrorResponse，直接转为 ApiClientError
  if (isRequestErrorResponse(data)) {
    return Promise.reject(new ApiClientError(data))
  }

  // 兜底：根据 HTTP 状态码提供友好提示
  const message = fallbackMessage(status)
  return Promise.reject(new Error(message))
})
