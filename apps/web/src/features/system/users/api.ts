import { request } from '@/lib/request'

import type { PaginationResponse } from '@/lib/request'
import type { CreateUser, UpdateUser, User, UsersSortBy, UsersSortOrder } from './types'

interface GetUserListParams {
  keyword?: string
  page?: number
  pageSize?: number
  status?: string[]
  role?: string[]
  sortBy?: UsersSortBy
  sortOrder?: UsersSortOrder
}

export const userApi = {
  getUserList: (params?: GetUserListParams) =>
    request.get<PaginationResponse<User>>('/user', { params }),
  createUser: (data: CreateUser) => request.post<User, CreateUser>('/user', data),
  updateUser: (id: string, data: UpdateUser) => request.patch<User, UpdateUser>(`/user/${id}`, data)
}
