import { request } from '@/lib/request'

import type {
  AdminResetPassword,
  AssignUserRoles,
  AssignUserRolesResult,
  CreateUser,
  CreateUserResult,
  ReplaceUserOrganizations,
  ReplaceUserOrganizationsResult,
  UpdateUser,
  UpdateUserResult,
  UpdateUsersStatus,
  User,
  UserListItem,
  UsersQuery
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

export const userApi = {
  getUserList: (params?: UsersQuery) =>
    request.get<PaginationResponse<UserListItem>>('/user', { params }),
  getUser: (id: string) => request.get<User>(`/user/${id}`),
  createUser: (data: CreateUser) => request.post<CreateUserResult, CreateUser>('/user', data),
  updateUser: (id: string, data: UpdateUser) =>
    request.patch<UpdateUserResult, UpdateUser>(`/user/${id}`, data),
  deleteUsers: (ids: string[]) =>
    request.delete<unknown, { ids: string[] }>('/user', {
      data: { ids }
    }),
  updateUsersStatus: (payload: UpdateUsersStatus) =>
    request.patch<unknown, UpdateUsersStatus>('/user/status', payload),
  unlock: (id: string) => request.post<UserListItem>(`/user/${id}/unlock`),
  adminResetPassword: (id: string, payload: AdminResetPassword) =>
    request.post<UserListItem, AdminResetPassword>(`/user/${id}/reset-password`, payload),
  revokeSessions: (id: string) => request.post<UserListItem>(`/user/${id}/revoke-sessions`),
  assignRoles: (id: string, payload: AssignUserRoles) =>
    request.patch<AssignUserRolesResult, AssignUserRoles>(`/user/${id}/roles`, payload),
  setPrimaryRole: (id: string, primaryRoleId: string) =>
    request.patch<AssignUserRolesResult, { primaryRoleId: string }>(`/user/${id}/primary-role`, {
      primaryRoleId
    }),
  replaceOrganizations: (id: string, payload: ReplaceUserOrganizations) =>
    request.patch<ReplaceUserOrganizationsResult, ReplaceUserOrganizations>(
      `/user/${id}/organizations`,
      payload
    )
}
