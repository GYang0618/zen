import type { AxiosResponse, CreateAxiosDefaults, InternalAxiosRequestConfig } from 'axios'

export * from 'axios'

type AsyncMaybe<T> = T | Promise<T>

export type PipelineMiddleware<TIn, TOut = TIn> = (value: TIn) => AsyncMaybe<TOut>

export type RequestMiddleware = PipelineMiddleware<InternalAxiosRequestConfig>
export type ResponseMiddleware = PipelineMiddleware<AxiosResponse>
// 错误中间件：接收 unknown，可选择“恢复并返回值”或“抛出/Reject 继续传递”
export type ErrorMiddleware = PipelineMiddleware<unknown, unknown>

export interface HttpClientConfig extends CreateAxiosDefaults {
  middlewares?: {
    request?: RequestMiddleware[]
    response?: ResponseMiddleware[]
    error?: ErrorMiddleware[]
  }
}
