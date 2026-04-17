import { createHttpClient, createRequest } from '@zen/request'

import { useEnv } from '@/config/env'

import { dataTransformMiddleware, globalErrorMiddleware, withTokenMiddleware } from './middleware'

export const httpClient = createHttpClient(() => {
  const { baseUrl, apiTimeout } = useEnv()
  return {
    baseURL: baseUrl,
    timeout: apiTimeout,
    middlewares: {
      request: [withTokenMiddleware],
      response: [dataTransformMiddleware],
      error: [globalErrorMiddleware]
    }
  }
})

export const request = createRequest(httpClient)
