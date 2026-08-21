import type {
  AssignUserRolesResult,
  CreateUserResult,
  Paged,
  ReplaceUserOrganizationsResult,
  UpdateUserResult,
  User,
  UserGender,
  UserMfaType,
  UserStatus
} from '@zen/shared'

export type UserListItemResponse = User
export type UserListResponse = Paged<UserListItemResponse>
export type UserResponse = User
export type CreateUserResponse = CreateUserResult
export type UpdateUserResponse = UpdateUserResult
export type AssignUserRolesResponse = AssignUserRolesResult
export type ReplaceUserOrganizationsResponse = ReplaceUserOrganizationsResult

export type { UserGender, UserMfaType, UserStatus }

export type UserTheme = 'light' | 'dark' | 'system'

export interface RoleInfoResponse {
  id: string
  code: string
  name: string
  description: string | null
  permissions: string[]
  isSystem: boolean
  status: 'active' | 'disabled'
  sort: number | null
  createdAt: string | null
  updatedAt: string | null
}

/** 当前登录用户档案（`GET /auth/me`），含偏好设置；管理端请使用 `User`。 */
export interface UserInfoResponse {
  id: string
  profile: {
    username: string
    nickname: string | null
    realName: string | null
    avatar: string | null
    gender: UserGender | null
  }
  contact: {
    email: string
    phoneNumber: string | null
  }
  auth: {
    roles: string[]
    permissions: string[]
    roleDetails: RoleInfoResponse[]
  }
  org: {
    deptId: string | null
    deptName: string | null
    jobTitle: string | null
  }
  organizations: Array<{
    organizationId: string
    organizationName: string | null
    isPrimary: boolean
    postId: string | null
    postName: string | null
  }>
  account: {
    status: UserStatus
    isVerified: boolean
    isLocked: boolean
    lockReason: string | null
    lockExpireAt: string | null
  }
  security: {
    mfaEnabled: boolean
    mfaType: UserMfaType | null
    passwordExpireAt: string | null
    lastPasswordChange: string | null
    loginAttempts: number | null
    mustChangePassword: boolean
  }
  preferences: {
    locale: string
    timezone: string
    theme: UserTheme
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    dashboard: {
      defaultView: string | null
      widgets: string[] | null
    } | null
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
  meta: Record<string, unknown> | null
}
