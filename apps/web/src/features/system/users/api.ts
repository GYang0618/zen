import { request } from '@/lib/request'

import type {
  AssignUserRoles,
  CreateUser,
  ReplaceUserOrganizations,
  UpdateUser,
  UpdateUsersStatus,
  User,
  UsersQuery
} from '@zen/shared'
import type { PaginationResponse } from '@/lib/request'

/** 与后端 UserInfoResponse 对齐 */
export type UserInfo = {
  id: string
  profile: {
    username: string
    nickname: string | null
    realName: string | null
    avatar: string | null
    gender: 'male' | 'female' | 'unknown' | null
  }
  contact: {
    email: string
    phoneNumber: string | null
  }
  auth: {
    roles: string[]
    permissions: string[]
    roleDetails: Array<{
      id: string
      code: string
      name: string
      description: string | null
      status: 'active' | 'disabled'
    }>
  }
  org: {
    deptId: string | null
    deptName: string | null
    jobTitle: string | null
  }
  account: {
    status: User['status']
    isVerified: boolean
    isLocked: boolean
    lockReason: string | null
    lockExpireAt: string | null
  }
  security: {
    mfaEnabled: boolean
    mfaType: 'totp' | 'sms' | 'email' | 'off' | null
    passwordExpireAt: string | null
    lastPasswordChange: string | null
    loginAttempts: number | null
  }
  audit: {
    createdAt: string
    createdBy: string | null
    updatedAt: string
    updatedBy: string | null
    lastLoginAt: string | null
    lastLoginIp: string | null
    lastActiveAt: string | null
  }
  remark: string | null
  organizations: Array<{
    organizationId: string
    organizationName: string | null
    isPrimary: boolean
    postId: string | null
    postName: string | null
  }>
}

export type AdminResetPasswordPayload = {
  password: string
  mustChangePassword?: boolean
}

export const userApi = {
  getUserList: (params?: UsersQuery) => request.get<PaginationResponse<User>>('/user', { params }),
  getUser: (id: string) => request.get<UserInfo>(`/user/${id}`),
  createUser: (data: CreateUser) => request.post<unknown, CreateUser>('/user', data),
  updateUser: (id: string, data: UpdateUser) =>
    request.patch<unknown, UpdateUser>(`/user/${id}`, data),
  deleteUsers: (ids: string[], stepUpToken?: string) =>
    request.delete<unknown, { ids: string[] }>('/user', {
      data: { ids },
      headers: stepUpToken ? { 'x-step-up-token': stepUpToken } : undefined
    }),
  updateUsersStatus: (payload: UpdateUsersStatus) =>
    request.patch<unknown, UpdateUsersStatus>('/user/status', payload),
  unlock: (id: string) => request.post<unknown>(`/user/${id}/unlock`),
  adminResetPassword: (id: string, payload: AdminResetPasswordPayload) =>
    request.post<unknown, AdminResetPasswordPayload>(`/user/${id}/reset-password`, payload),
  assignRoles: (id: string, payload: AssignUserRoles, stepUpToken: string) =>
    request.patch<UserInfo, AssignUserRoles>(`/user/${id}/roles`, payload, {
      headers: { 'x-step-up-token': stepUpToken }
    }),
  replaceOrganizations: (id: string, payload: ReplaceUserOrganizations) =>
    request.patch<UserInfo, ReplaceUserOrganizations>(`/user/${id}/organizations`, payload)
}
