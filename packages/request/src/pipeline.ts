import type {
  ErrorMiddleware,
  PipelineMiddleware,
  RequestMiddleware,
  ResponseMiddleware
} from './types'

export const createRequestMiddleware = (fn: RequestMiddleware) => fn
export const createResponseMiddleware = (fn: ResponseMiddleware) => fn
export const createErrorMiddleware = (fn: ErrorMiddleware) => fn

export function runPipeline<T>(middlewares: readonly PipelineMiddleware<T>[]) {
  return async (value: T) => {
    let current = value

    for (const middleware of middlewares) {
      current = await middleware(current)
    }

    return current
  }
}
