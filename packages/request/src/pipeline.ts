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

export function runErrorPipeline(middlewares: readonly ErrorMiddleware[]) {
  return async (error: unknown): Promise<unknown> => {
    let currentError: unknown = error

    for (const middleware of middlewares) {
      try {
        return await middleware(currentError)
      } catch (nextError) {
        currentError = nextError
      }
    }

    return Promise.reject(currentError)
  }
}
