// ─── 内部工具函数 ─────────────────────────────────────────

import type { RequestErrorResponse } from './types'

export function isRequestErrorResponse(data: unknown): data is RequestErrorResponse {
  return typeof data === 'object' && data !== null && 'code' in data && 'message' in data
}

export function buildFallback(code: number, message: string): RequestErrorResponse {
  return { code, message, path: '', timestamp: new Date().toISOString() }
}

export function fallbackMessage(status: number | undefined): string {
  switch (status) {
    case 400:
      return '请求参数错误'
    case 401:
      return '未登录或登录已过期'
    case 403:
      return '无权访问该资源'
    case 404:
      return '请求的资源不存在'
    case 408:
      return '请求超时，请稍后重试'
    case 422:
      return '数据格式校验失败'
    case 429:
      return '操作过于频繁，请稍后再试'
    case 500:
      return '服务器内部错误，请稍后重试'
    case 502:
      return '网关错误，请稍后重试'
    case 503:
      return '服务暂时不可用，请稍后重试'
    case 504:
      return '网关超时，请稍后重试'
    default:
      return status ? `请求失败（${status}）` : '网络连接异常，请检查网络'
  }
}
