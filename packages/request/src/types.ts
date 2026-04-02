import type {
  AxiosError,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig
} from 'axios'

type AsyncMaybe<T> = T | Promise<T>

export type PipelineMiddleware<T> = (value: T) => AsyncMaybe<T>

export type RequestMiddleware = PipelineMiddleware<InternalAxiosRequestConfig>
export type ResponseMiddleware = PipelineMiddleware<AxiosResponse>
// 错误中间件：接收 unknown，必须重新抛出（返回 Promise<never>）
export type ErrorMiddleware = PipelineMiddleware<AxiosError>

export interface HttpClientConfig extends CreateAxiosDefaults {
  middlewares?: {
    request?: RequestMiddleware[]
    response?: ResponseMiddleware[]
    error?: ErrorMiddleware[]
  }
}
