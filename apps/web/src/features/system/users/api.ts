import { request } from '@/lib/request'

import type {
  AdminResetPassword,
  AssignUserRoles,
  CreateUser,
  ReplaceUserOrganizations,
  UpdateUser,
  UpdateUsersStatus,
  User,
  UsersQuery
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

export const userApi = {
  getUserList: (params?: UsersQuery) => request.get<PaginationResponse<User>>('/user', { params }),
  getUser: (id: string) => request.get<User>(`/user/${id}`),
  createUser: (data: CreateUser) => request.post<User, CreateUser>('/user', data),
  updateUser: (id: string, data: UpdateUser) =>
    request.patch<User, UpdateUser>(`/user/${id}`, data),
  deleteUsers: (ids: string[], stepUpToken?: string) =>
    request.delete<unknown, { ids: string[] }>('/user', {
      data: { ids },
      headers: stepUpToken ? { 'x-step-up-token': stepUpToken } : undefined
    }),
  updateUsersStatus: (payload: UpdateUsersStatus) =>
    request.patch<unknown, UpdateUsersStatus>('/user/status', payload),
  unlock: (id: string) => request.post<User>(`/user/${id}/unlock`),
  adminResetPassword: (id: string, payload: AdminResetPassword) =>
    request.post<User, AdminResetPassword>(`/user/${id}/reset-password`, payload),
  revokeSessions: (id: string) => request.post<User>(`/user/${id}/revoke-sessions`),
  assignRoles: (id: string, payload: AssignUserRoles, stepUpToken: string) =>
    request.patch<User, AssignUserRoles>(`/user/${id}/roles`, payload, {
      headers: { 'x-step-up-token': stepUpToken }
    }),
  replaceOrganizations: (id: string, payload: ReplaceUserOrganizations) =>
    request.patch<User, ReplaceUserOrganizations>(`/user/${id}/organizations`, payload)
}
