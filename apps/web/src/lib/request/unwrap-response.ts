import type { AxiosResponse } from '@zen/request'
import type { RequestResponse } from './types'

export function unwrapResponseData<T = unknown>(
  response: AxiosResponse<RequestResponse<T>>
): T | null {
  const body = response.data
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data
  }
  return null
}
