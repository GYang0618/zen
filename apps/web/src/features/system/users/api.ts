import { request } from '@/lib/request'

import type { CreateUser, UpdateUser, UpdateUsersStatus, User, UsersQuery } from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

export const userApi = {
  getUserList: (params?: UsersQuery) => request.get<PaginationResponse<User>>('/user', { params }),
  createUser: (data: CreateUser) => request.post<unknown, CreateUser>('/user', data),
  updateUser: (id: string, data: UpdateUser) =>
    request.patch<unknown, UpdateUser>(`/user/${id}`, data),
  deleteUsers: (ids: string[]) =>
    request.delete<unknown, { ids: string[] }>('/user', { data: { ids } }),
  updateUsersStatus: (payload: UpdateUsersStatus) =>
    request.patch<unknown, UpdateUsersStatus>('/user/status', payload)
}
