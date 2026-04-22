import { createHttpClient, createRequest } from '@zen/request'

import { useEnv } from '@/config/env'

import {
  dataTransformMiddleware,
  globalErrorMiddleware,
  tokenRefreshMiddleware,
  withTokenMiddleware
} from './middleware'

/**
 * 将数组序列化为重复键（status=a&status=b），而非默认的 status[]=a&status[]=b。
 * 后端使用 Fastify，默认 querystring 解析器不支持方括号语法。
 */
const paramsSerializer = (params: Record<string, unknown>) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue
        search.append(key, String(item))
      }
    } else {
      search.append(key, String(value))
    }
  }
  return search.toString()
}

export const http = createHttpClient(() => {
  const { baseUrl, apiTimeout } = useEnv()
  return {
    baseURL: baseUrl,
    timeout: apiTimeout,
    withCredentials: true,
    paramsSerializer,
    middlewares: {
      request: [withTokenMiddleware],
      response: [dataTransformMiddleware],
      error: [tokenRefreshMiddleware, globalErrorMiddleware]
    }
  }
})

export const anonymousHttp = createHttpClient(() => {
  const { baseUrl, apiTimeout } = useEnv()
  return {
    baseURL: baseUrl,
    timeout: apiTimeout,
    withCredentials: true,
    paramsSerializer
  }
})

export const request = createRequest(http)
