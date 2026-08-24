import { toApiOrganizationType } from '@/modules/organization/organization.mapper'

import type { Gender, MfaType, Prisma, Theme, UserStatusCode } from '@prisma/client'
import type {
  AssignUserRolesResult,
  ReplaceUserOrganizationsResult,
  UpdateUserResult,
  User,
  UserGender,
  UserMfaType,
  UserRolePreview,
  UserStatus
} from '@zen/shared'
import type {
  RoleInfoResponse,
  UserInfoResponse,
  UserListItemResponse,
  UserTheme
} from './responses/user.response'
import type { UserBasicInfo, UserOrganizations, UserRoles, UserWithDomain } from './user.repository'

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

export function toUserStatus(status: UserStatusCode): UserStatus {
  return USER_STATUS_MAP[status]
}

function toGender(gender?: Gender | null): UserGender {
  return gender ? GENDER_MAP[gender] : 'unknown'
}

export function toBirthdayDate(value: string | null): Date | null {
  if (value === null) return null
  return new Date(`${value}T00:00:00.000Z`)
}

export function toBirthdayString(value: Date | null | undefined): string | null {
  if (!value) return null
  return value.toISOString().slice(0, 10)
}

function toMfaType(mfaType?: MfaType | null): UserMfaType {
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

function toRolePreview(roles: UserRoles['roles']): UserRolePreview[] {
  return roles.map(({ role }) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description ?? null,
    icon: role.icon ?? null,
    iconColor: role.iconColor ?? null,
    kind: role.kind === 'SYSTEM' ? 'system' : 'custom',
    status: role.status === 'ACTIVE' ? 'active' : 'disabled',
    permissionCount: role.permissions.length
  }))
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

function toOrganizations(organizations: UserOrganizations['organizations']): User['organizations'] {
  return organizations.map((item) => ({
    organizationId: item.organizationId,
    organizationName: item.organization.name,
    organizationCode: item.organization.code,
    organizationType: toApiOrganizationType(item.organization.type),
    isPrimary: item.isPrimary,
    postId: item.postId ?? null,
    postName: item.post?.jobProfile.name ?? null,
    postLevel: item.post?.level ?? item.post?.jobProfile.level ?? null,
    joinedAt: item.joinedAt?.toISOString() ?? null
  }))
}

export function toUpdateUserResult(user: UserBasicInfo): UpdateUserResult {
  return {
    id: user.id,
    nickname: user.nickname ?? null,
    realName: user.profile?.realName ?? null,
    avatar: user.profile?.avatar ?? null,
    gender: toGender(user.profile?.gender),
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    remark: user.profile?.remark ?? null,
    updatedAt: user.updatedAt.toISOString()
  }
}

export function toAssignUserRolesResult(user: UserRoles): AssignUserRolesResult {
  return {
    id: user.id,
    roles: toRolePreview(user.roles)
  }
}

export function toReplaceUserOrganizationsResult(
  user: UserOrganizations
): ReplaceUserOrganizationsResult {
  return {
    id: user.id,
    organizations: toOrganizations(user.organizations)
  }
}

function toActiveSessions(sessions: UserWithDomain['sessions']) {
  const now = Date.now()
  return sessions.filter((item) => item.expiresAt.getTime() > now)
}

function toAccessTokenExpiresAt(sessionCreatedAt: Date | undefined, accessTokenTtlMs: number) {
  if (!sessionCreatedAt) return null
  return new Date(sessionCreatedAt.getTime() + accessTokenTtlMs).toISOString()
}

export function toUserResponse(user: UserWithDomain, accessTokenTtlMs: number): User {
  const { profile, security, audit } = user
  const activeSessions = toActiveSessions(user.sessions)

  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname ?? null,
    realName: profile?.realName ?? null,
    avatar: profile?.avatar ?? null,
    gender: toGender(profile?.gender),
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    status: toUserStatus(user.status),
    isLocked: user.isLocked,
    lockExpireAt: user.lockExpireAt?.toISOString() ?? null,
    roles: toRolePreview(user.roles),
    organizations: toOrganizations(user.organizations),
    mfaEnabled: security?.mfaEnabled ?? false,
    mfaType: toMfaType(security?.mfaType),
    mustChangePassword: security?.mustChangePassword ?? false,
    lastPasswordChange: security?.lastPasswordChange?.toISOString() ?? null,
    passwordExpireAt: security?.passwordExpireAt?.toISOString() ?? null,
    loginAttempts: user.loginAttempts,
    lastLoginAt: audit?.lastLoginAt?.toISOString() ?? null,
    lastLoginIp: audit?.lastLoginIp ?? null,
    lastActiveAt: audit?.lastActiveAt?.toISOString() ?? null,
    activeSessionCount: activeSessions.length,
    accessTokenExpiresAt: toAccessTokenExpiresAt(activeSessions[0]?.createdAt, accessTokenTtlMs),
    remark: profile?.remark ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }
}

export function toUserListItemResponse(
  user: UserWithDomain,
  accessTokenTtlMs: number
): UserListItemResponse {
  return toUserResponse(user, accessTokenTtlMs)
}

export function toUserInfoResponse(user: UserWithDomain): UserInfoResponse {
  const { profile, security, preference, audit, organizations, roles } = user
  const primaryOrg = organizations.find((item) => item.isPrimary) ?? organizations[0]
  const roleDetails = toRoleDetails(roles)
  const permissions = collectPermissions(roleDetails)
  const primaryPostName = primaryOrg?.post?.jobProfile.name ?? null

  return {
    id: user.id,
    profile: {
      username: user.username,
      nickname: user.nickname ?? null,
      realName: profile?.realName ?? null,
      avatar: profile?.avatar ?? null,
      gender: toGender(profile?.gender),
      birthday: toBirthdayString(profile?.birthday)
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
      deptId: primaryOrg?.organizationId ?? null,
      deptName: primaryOrg?.organization.name ?? null,
      jobTitle: primaryPostName ?? profile?.jobTitle ?? null
    },
    organizations: organizations.map((item) => ({
      organizationId: item.organizationId,
      organizationName: item.organization.name ?? null,
      isPrimary: item.isPrimary,
      postId: item.postId ?? null,
      postName: item.post?.jobProfile.name ?? null
    })),
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
      loginAttempts: user.loginAttempts,
      mustChangePassword: security?.mustChangePassword ?? false
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
