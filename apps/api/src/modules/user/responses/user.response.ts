export interface RoleInfoResponse {
  id: string
  code: string
  name: string
  description?: string
  permissions: string[]
  isSystem: boolean
  status: 'active' | 'disabled'
  sort?: number
  createdAt?: string
  updatedAt?: string
}

export interface UserInfoResponse {
  id: string
  profile: {
    username: string
    nickname?: string
    realName?: string
    avatar?: string
    gender?: 'male' | 'female' | 'unknown'
  }
  contact?: {
    email: string
    phone?: string
  }
  auth?: {
    roles: string[]
    permissions?: string[]
    roleDetails?: RoleInfoResponse[]
  }
  org?: {
    deptId?: string
    deptName?: string
    jobTitle?: string
  }
  account: {
    status: 'active' | 'disabled' | 'locked' | 'pending'
    isVerified: boolean
    isLocked: boolean
    lockReason?: string
    lockExpireAt?: string
  }
  security?: {
    mfaEnabled: boolean
    mfaType?: 'totp' | 'sms' | 'email' | 'off'
    passwordExpireAt?: string
    lastPasswordChange?: string
    loginAttempts?: number
  }
  preferences: {
    locale: string
    timezone: string
    theme: 'light' | 'dark' | 'system'
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    dashboard?: {
      defaultView?: string
      widgets?: string[]
    }
  }
  audit: {
    createdAt: string
    createdBy?: string
    updatedAt: string
    updatedBy?: string
    lastLoginAt?: string
    lastLoginIp?: string
    lastActiveAt?: string
  }
  remark?: string
  meta?: Record<string, unknown>
}

export interface UserPaginationResponse {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface UserListResponse {
  items: UserInfoResponse[]
  pagination: UserPaginationResponse
}
