import { request } from '@/lib/request'

import type { PaginationResponse } from '@/lib/request'
import type { Role } from './types'

interface GetRoleListParams {
  keyword?: string
  page?: number
  pageSize?: number
  status?: string[]
  dataScope?: string[]
}

export const roleApi = {
  getRoleList: (params?: GetRoleListParams) =>
    request.get<PaginationResponse<Role>>('/role', { params })
}
