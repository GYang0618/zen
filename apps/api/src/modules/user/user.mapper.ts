import { Gender, MfaType, Prisma, Theme, UserStatusCode } from '@prisma/client'

import { UserStatus } from './dto/find-users-query.dto'

import type {
  RoleInfoResponse,
  UserGender,
  UserInfoResponse,
  UserListItemResponse,
  UserMfaType,
  UserTheme
} from './responses/user.response'
import type { UserWithDomain } from './user.repository'

const GENDER_MAP: Record<Gender, UserGender> = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'unknown'
}

const MFA_TYPE_MAP: Record<MfaType, UserMfaType> = {
  TOTP: 'totp',
  SMS: 'sms',
  EMAIL: 'email',
  OFF: 'off'
}

const THEME_MAP: Record<Theme, UserTheme> = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

const USER_STATUS_MAP: Record<UserStatusCode, UserStatus> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
}

function toUserStatus(status: UserStatusCode): UserStatus {
  return USER_STATUS_MAP[status]
}

function toGender(gender?: Gender): UserInfoResponse['profile']['gender'] {
  return gender ? GENDER_MAP[gender] : null
}

function toMfaType(mfaType?: MfaType): NonNullable<UserInfoResponse['security']>['mfaType'] {
  return mfaType ? MFA_TYPE_MAP[mfaType] : 'off'
}

function toTheme(theme?: Theme): UserInfoResponse['preferences']['theme'] {
  return theme ? THEME_MAP[theme] : 'system'
}

function toDashboardSettings(
  raw?: Prisma.JsonValue | null
): UserInfoResponse['preferences']['dashboard'] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const value = raw as Record<string, unknown>
  return {
    defaultView: typeof value.defaultView === 'string' ? value.defaultView : null,
    widgets: Array.isArray(value.widgets)
      ? value.widgets.filter((item): item is string => typeof item === 'string')
      : null
  }
}

function toMeta(raw?: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

function toRoleDetails(roles: UserWithDomain['roles']): RoleInfoResponse[] {
  return roles.map(({ role }) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description ?? null,
    permissions: role.permissions.map((item) => item.permission.code),
    isSystem: role.isSystem,
    status: role.status === 'ACTIVE' ? 'active' : ('disabled' as const),
    sort: role.sort ?? null,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString()
  }))
}

function collectPermissions(roleDetails: RoleInfoResponse[]): string[] {
  const permissionSet = new Set<string>()
  for (const role of roleDetails) {
    for (const permission of role.permissions) {
      permissionSet.add(permission)
    }
  }
  return Array.from(permissionSet)
}

function getPrimaryRoleCode(roles: UserWithDomain['roles']): string | null {
  return roles[0]?.role.code ?? null
}

export function toUserInfoResponse(user: UserWithDomain): UserInfoResponse {
  const { profile, security, preference, audit, departments, roles } = user
  const primaryDept = departments.find((d) => d.isPrimary) ?? departments[0]
  const roleDetails = toRoleDetails(roles)
  const permissions = collectPermissions(roleDetails)

  return {
    id: user.id,
    profile: {
      username: user.username,
      nickname: user.nickname ?? null,
      realName: profile?.realName ?? null,
      avatar: profile?.avatar ?? null,
      gender: toGender(profile?.gender)
    },
    contact: {
      email: user.email,
      phoneNumber: user.phoneNumber ?? null
    },
    auth: {
      roles: roleDetails.map((r) => r.code),
      permissions,
      roleDetails
    },
    org: {
      deptId: primaryDept?.departmentId ?? null,
      deptName: primaryDept?.department.name ?? null,
      jobTitle: profile?.jobTitle ?? null
    },
    account: {
      status: toUserStatus(user.status),
      isVerified: true,
      isLocked: user.isLocked,
      lockReason: null,
      lockExpireAt: user.lockExpireAt?.toISOString() ?? null
    },
    security: {
      mfaEnabled: security?.mfaEnabled ?? false,
      mfaType: toMfaType(security?.mfaType),
      passwordExpireAt: security?.passwordExpireAt?.toISOString() ?? null,
      lastPasswordChange: security?.lastPasswordChange?.toISOString() ?? null,
      loginAttempts: user.loginAttempts
    },
    preferences: {
      locale: preference?.locale ?? 'zh-CN',
      timezone: preference?.timezone ?? 'Asia/Shanghai',
      theme: toTheme(preference?.theme),
      notifications: {
        email: preference?.notifyByEmail ?? true,
        push: preference?.notifyByPush ?? true,
        sms: preference?.notifyBySms ?? false
      },
      dashboard: toDashboardSettings(preference?.dashboardSettings)
    },
    audit: {
      createdAt: user.createdAt.toISOString(),
      createdBy: audit?.createdBy ?? null,
      updatedAt: user.updatedAt.toISOString(),
      updatedBy: audit?.updatedBy ?? null,
      lastLoginAt: audit?.lastLoginAt?.toISOString() ?? null,
      lastLoginIp: audit?.lastLoginIp ?? null,
      lastActiveAt: audit?.lastActiveAt?.toISOString() ?? null
    },
    remark: profile?.remark ?? null,
    meta: toMeta(profile?.meta)
  }
}

export function toUserListItemResponse(user: UserWithDomain): UserListItemResponse {
  const { profile, roles } = user
  const primaryDept = user.departments.find((d) => d.isPrimary) ?? user.departments[0]

  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname ?? null,
    realName: profile?.realName ?? null,
    avatar: profile?.avatar ?? null,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    status: toUserStatus(user.status),
    role: getPrimaryRoleCode(roles),
    deptName: primaryDept?.department.name ?? null,
    jobTitle: profile?.jobTitle ?? null,
    permissions: collectPermissions(toRoleDetails(roles)),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }
}
