export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  requestId?: string
  timestamp: string
}

export interface ApiErrorResponse {
  code: number
  message: string
  path: string
  requestId?: string
  timestamp: string
  error?: { name?: string; message?: string; stack?: string }
  /** 按字段分组的验证错误 */
  fieldErrors?: Record<string, string[]>
  /** 顶层（非字段级）验证错误 */
  formErrors?: string[]
}
