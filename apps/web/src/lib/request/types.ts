import type { InternalAxiosRequestConfig } from '@zen/request/types'

export interface RequestResponse<T> {
  code: number
  message: string
  data: T
  requestId?: string
  timestamp: string
}

export interface RequestErrorResponse {
  code: number
  message: string
  path: string
  requestId?: string
  timestamp: string
  /** 开发环境下 server 返回的原始错误信息 */
  error?: { name?: string; message?: string; stack?: string }
  fieldErrors?: Record<string, string[]>
  formErrors?: string[]
}

/** 封装 API 业务错误，包含字段级和表单级验证错误 */
export class ApiClientError extends Error {
  readonly code: number
  readonly fieldErrors?: Record<string, string[]>
  readonly formErrors?: string[]

  constructor(response: RequestErrorResponse) {
    super(response.message)
    this.name = 'ApiClientError'
    this.code = response.code
    this.fieldErrors = response.fieldErrors
    this.formErrors = response.formErrors
  }
}

export type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}
