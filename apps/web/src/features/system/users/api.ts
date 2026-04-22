import { request } from '@/lib/request'

import type { PaginationResponse } from '@/lib/request'
import type { User } from './types'

interface GetUserListParams {
  keyword?: string
  page?: number
  pageSize?: number
}

export const userApi = {
  getUserList: (params?: GetUserListParams) =>
    request.get<PaginationResponse<User>>('/user', { params })
}
