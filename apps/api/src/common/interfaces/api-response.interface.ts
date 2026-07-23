export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  /** 请求追踪 ID（与响应头 x-trace-id 一致） */
  traceId: string
  timestamp: string
}

export interface ApiErrorDetail {
  name: string | null
  message: string | null
  stack: string | null
}

export interface ApiErrorResponse {
  code: number
  message: string
  path: string
  /** 请求追踪 ID（与响应头 x-trace-id 一致） */
  traceId: string
  timestamp: string
  error: ApiErrorDetail | null
  /** 按字段分组的验证错误 */
  fieldErrors: Record<string, string[]> | null
  /** 顶层（非字段级）验证错误 */
  formErrors: string[] | null
}
