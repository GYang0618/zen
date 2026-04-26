import type { Paged, User, UserStatus } from '@zen/shared'

export type UserListItemResponse = User
export type UserListResponse = Paged<UserListItemResponse>

export type UserMfaType = 'totp' | 'sms' | 'email' | 'off'
export type UserTheme = 'light' | 'dark' | 'system'
export type UserGender = 'male' | 'female' | 'unknown'

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
