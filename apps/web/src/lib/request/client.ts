import { createHttpClient, createRequest } from '@zen/request'

import { useEnv } from '@/config/env'

import {
  dataTransformMiddleware,
  globalErrorMiddleware,
  tokenRefreshMiddleware,
  withTokenMiddleware
} from './middleware'

export const http = createHttpClient(() => {
  const { baseUrl, apiTimeout } = useEnv()
  return {
    baseURL: baseUrl,
    timeout: apiTimeout,
    withCredentials: true,
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
    withCredentials: true
  }
})

export const request = createRequest(http)
