import { Gender, MfaType, Prisma, Theme, UserStatusCode } from '@prisma/client'

import type {
  RoleInfoResponse,
  UserInfoResponse,
  UserListItemResponse
} from './responses/user.response'
import type { UserWithDomain } from './user.repository'

const GENDER_MAP: Record<Gender, UserInfoResponse['profile']['gender']> = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'unknown'
}

const MFA_TYPE_MAP: Record<MfaType, NonNullable<UserInfoResponse['security']>['mfaType']> = {
  TOTP: 'totp',
  SMS: 'sms',
  EMAIL: 'email',
  OFF: 'off'
}

const THEME_MAP: Record<Theme, UserInfoResponse['preferences']['theme']> = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

function toAccountStatus(
  status: UserStatusCode,
  isLocked: boolean
): UserInfoResponse['account']['status'] {
  if (isLocked) return 'locked'
  return status === UserStatusCode.DISABLED ? 'disabled' : 'active'
}

function toGender(gender?: Gender): UserInfoResponse['profile']['gender'] {
  return gender ? GENDER_MAP[gender] : undefined
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
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined

  const value = raw as Record<string, unknown>
  return {
    defaultView: typeof value.defaultView === 'string' ? value.defaultView : undefined,
    widgets: Array.isArray(value.widgets)
      ? value.widgets.filter((item): item is string => typeof item === 'string')
      : undefined
  }
}

function toMeta(raw?: Prisma.JsonValue | null): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  return raw as Record<string, unknown>
}

function toRoleDetails(roles: UserWithDomain['roles']): RoleInfoResponse[] {
  return roles.map(({ role }) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description ?? undefined,
    permissions: role.permissions.map((item) => item.permission.code),
    isSystem: role.isSystem,
    status: role.status === 'ACTIVE' ? 'active' : ('disabled' as const),
    sort: role.sort ?? undefined,
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

function getPrimaryRoleCode(roles: UserWithDomain['roles']): string | undefined {
  return roles[0]?.role.code
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
      nickname: user.nickname ?? undefined,
      realName: profile?.realName ?? undefined,
      avatar: profile?.avatar ?? undefined,
      gender: toGender(profile?.gender)
    },
    contact: {
      email: user.email,
      phone: user.phone ?? undefined
    },
    auth: {
      roles: roleDetails.map((r) => r.code),
      permissions,
      roleDetails
    },
    org: {
      deptId: primaryDept?.departmentId,
      deptName: primaryDept?.department.name,
      jobTitle: profile?.jobTitle ?? undefined
    },
    account: {
      status: toAccountStatus(user.status, user.isLocked),
      isVerified: true,
      isLocked: user.isLocked,
      lockExpireAt: user.lockExpireAt?.toISOString()
    },
    security: {
      mfaEnabled: security?.mfaEnabled ?? false,
      mfaType: toMfaType(security?.mfaType),
      passwordExpireAt: security?.passwordExpireAt?.toISOString(),
      lastPasswordChange: security?.lastPasswordChange?.toISOString(),
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
      createdBy: audit?.createdBy ?? undefined,
      updatedAt: user.updatedAt.toISOString(),
      updatedBy: audit?.updatedBy ?? undefined,
      lastLoginAt: audit?.lastLoginAt?.toISOString(),
      lastLoginIp: audit?.lastLoginIp ?? undefined,
      lastActiveAt: audit?.lastActiveAt?.toISOString()
    },
    remark: profile?.remark ?? undefined,
    meta: toMeta(profile?.meta)
  }
}

export function toUserListItemResponse(user: UserWithDomain): UserListItemResponse {
  const { profile, roles } = user
  const primaryDept = user.departments.find((d) => d.isPrimary) ?? user.departments[0]

  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname ?? undefined,
    realName: profile?.realName ?? undefined,
    avatar: profile?.avatar ?? undefined,
    email: user.email,
    phone: user.phone ?? undefined,
    phoneNumber: user.phone ?? undefined,
    status:
      user.isLocked || user.status === UserStatusCode.DISABLED
        ? user.isLocked
          ? 'locked'
          : 'disabled'
        : 'active',
    role: getPrimaryRoleCode(roles),
    deptName: primaryDept?.department.name,
    jobTitle: profile?.jobTitle ?? undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }
}
