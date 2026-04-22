import { request } from '@/lib/request'

import type { PaginationResponse } from '@/lib/request'
import type { User } from './types'

interface GetUserListParams {
  keyword?: string
  page?: number
  pageSize?: number
  status?: string[]
  role?: string[]
}

export const userApi = {
  getUserList: (params?: GetUserListParams) =>
    request.get<PaginationResponse<User>>('/user', { params })
}
