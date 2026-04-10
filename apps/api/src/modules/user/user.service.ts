import { Injectable, NotFoundException } from '@nestjs/common'
import { Gender, MfaType, Prisma, Theme, User } from '@prisma/client'
import argon2 from 'argon2'

import { PrismaService } from '@/infra/prisma/prisma.service'

import type { CreateUserDto } from './dto/create-user.dto'
import type { RoleInfoResponse, UserInfoResponse } from './responses/user.response'

const USER_INCLUDE = {
  profile: true,
  security: true,
  preference: true,
  audit: true,
  departments: {
    include: {
      department: true
    }
  },
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.UserInclude

type UserWithDomain = Prisma.UserGetPayload<{
  include: typeof USER_INCLUDE
}>

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<UserInfoResponse> {
    const hashedPassword = await argon2.hash(data.password)
    const created = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        nickname: data.nickname,
        password: hashedPassword
      }
    })

    await this.ensureUserDomainData(created.id)
    await this.assignRoleByCode(created.id, 'guest')
    return this.getUserInfoByUserId(created.id)
  }

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where
    })
  }

  async getUserInfoByUserId(userId: string): Promise<UserInfoResponse> {
    await this.ensureUserDomainData(userId)

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: USER_INCLUDE
    })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return this.toUserInfo(user)
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<UserInfoResponse> {
    const { where, data } = params
    const passwordValue = data.password
    const nextData: Prisma.UserUpdateInput = { ...data }
    if (typeof passwordValue === 'string') {
      nextData.password = await argon2.hash(passwordValue)
    }

    const updated = await this.prisma.user.update({
      data: nextData,
      where
    })

    await this.ensureUserDomainData(updated.id)
    return this.getUserInfoByUserId(updated.id)
  }

  async findAll(): Promise<UserInfoResponse[]> {
    const users = await this.prisma.user.findMany({
      include: USER_INCLUDE
    })

    const missing = users
      .filter((user) => !user.profile || !user.security || !user.preference || !user.audit)
      .map((user) => user.id)

    if (missing.length === 0) {
      return users.map((user) => this.toUserInfo(user))
    }

    await Promise.all(missing.map((id) => this.ensureUserDomainData(id)))
    const hydrated = await this.prisma.user.findMany({
      include: USER_INCLUDE
    })
    return hydrated.map((user) => this.toUserInfo(user))
  }

  async remove(id: string): Promise<UserInfoResponse> {
    const deleted = await this.prisma.user.delete({
      where: { id }
    })

    return {
      id: deleted.id,
      profile: {
        username: deleted.username,
        nickname: deleted.nickname ?? undefined
      },
      contact: {
        email: deleted.email,
        phone: deleted.phone ?? undefined
      },
      account: {
        status: this.toAccountStatus(deleted.status, deleted.isLocked),
        isVerified: true,
        isLocked: deleted.isLocked,
        lockExpireAt: deleted.lockExpireAt?.toISOString()
      },
      preferences: {
        locale: 'zh-CN',
        timezone: 'Asia/Shanghai',
        theme: 'system',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      audit: {
        createdAt: deleted.createdAt.toISOString(),
        updatedAt: deleted.updatedAt.toISOString()
      }
    }
  }

  async ensureUserDomainData(userId: string) {
    await this.prisma.$transaction([
      this.prisma.userProfile.upsert({
        where: { userId },
        create: { userId },
        update: {}
      }),
      this.prisma.userSecurity.upsert({
        where: { userId },
        create: { userId },
        update: {}
      }),
      this.prisma.userPreference.upsert({
        where: { userId },
        create: { userId },
        update: {}
      }),
      this.prisma.userAudit.upsert({
        where: { userId },
        create: { userId },
        update: {}
      })
    ])
  }

  async touchLoginAudit(userId: string, loginIp?: string) {
    await this.ensureUserDomainData(userId)
    await this.prisma.userAudit.update({
      where: { userId },
      data: {
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
        lastLoginIp: loginIp
      }
    })
  }

  async assignRoleByCode(userId: string, roleCode: string) {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode }
    })
    if (!role) {
      return
    }

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id
        }
      },
      create: {
        userId,
        roleId: role.id
      },
      update: {}
    })
  }

  private toUserInfo(user: UserWithDomain): UserInfoResponse {
    const department = user.departments.find((item) => item.isPrimary) ?? user.departments[0]
    const roleDetails: RoleInfoResponse[] = user.roles.map(({ role }) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description ?? undefined,
      permissions: role.permissions.map((item) => item.permission.code),
      isSystem: role.isSystem,
      status: role.status === 'ACTIVE' ? 'active' : 'disabled',
      sort: role.sort ?? undefined,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString()
    }))
    const permissionSet = new Set<string>()
    roleDetails.forEach((role) => {
      role.permissions.forEach((permission) => permissionSet.add(permission))
    })

    const profile = user.profile
    const security = user.security
    const preference = user.preference
    const audit = user.audit

    return {
      id: user.id,
      profile: {
        username: user.username,
        nickname: user.nickname ?? undefined,
        realName: profile?.realName ?? undefined,
        avatar: profile?.avatar ?? undefined,
        gender: this.toGender(profile?.gender)
      },
      contact: {
        email: user.email,
        phone: user.phone ?? undefined
      },
      auth: {
        roles: roleDetails.map((role) => role.code),
        permissions: Array.from(permissionSet),
        roleDetails
      },
      org: {
        deptId: department?.departmentId,
        deptName: department?.department.name,
        jobTitle: profile?.jobTitle ?? undefined
      },
      account: {
        status: this.toAccountStatus(user.status, user.isLocked),
        isVerified: true,
        isLocked: user.isLocked,
        lockExpireAt: user.lockExpireAt?.toISOString()
      },
      security: {
        mfaEnabled: security?.mfaEnabled ?? false,
        mfaType: this.toMfaType(security?.mfaType),
        passwordExpireAt: security?.passwordExpireAt?.toISOString(),
        lastPasswordChange: security?.lastPasswordChange?.toISOString(),
        loginAttempts: user.loginAttempts
      },
      preferences: {
        locale: preference?.locale ?? 'zh-CN',
        timezone: preference?.timezone ?? 'Asia/Shanghai',
        theme: this.toTheme(preference?.theme),
        notifications: {
          email: preference?.notifyByEmail ?? true,
          push: preference?.notifyByPush ?? true,
          sms: preference?.notifyBySms ?? false
        },
        dashboard: this.toDashboardSettings(preference?.dashboardSettings)
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
      meta: this.toMeta(profile?.meta)
    }
  }

  private toAccountStatus(
    status: number,
    isLocked: boolean
  ): UserInfoResponse['account']['status'] {
    if (isLocked) {
      return 'locked'
    }

    if (status === 0) {
      return 'disabled'
    }

    return 'active'
  }

  private toGender(gender?: Gender): UserInfoResponse['profile']['gender'] {
    if (!gender) {
      return undefined
    }

    if (gender === 'MALE') {
      return 'male'
    }
    if (gender === 'FEMALE') {
      return 'female'
    }

    return 'unknown'
  }

  private toMfaType(mfaType?: MfaType): NonNullable<UserInfoResponse['security']>['mfaType'] {
    if (!mfaType) {
      return 'off'
    }

    if (mfaType === 'TOTP') return 'totp'
    if (mfaType === 'SMS') return 'sms'
    if (mfaType === 'EMAIL') return 'email'
    return 'off'
  }

  private toTheme(theme?: Theme): UserInfoResponse['preferences']['theme'] {
    if (!theme) {
      return 'system'
    }

    if (theme === 'LIGHT') return 'light'
    if (theme === 'DARK') return 'dark'
    return 'system'
  }

  private toDashboardSettings(
    dashboardSettings?: Prisma.JsonValue | null
  ): UserInfoResponse['preferences']['dashboard'] {
    if (
      !dashboardSettings ||
      typeof dashboardSettings !== 'object' ||
      Array.isArray(dashboardSettings)
    ) {
      return undefined
    }

    const value = dashboardSettings as Record<string, unknown>
    return {
      defaultView: typeof value.defaultView === 'string' ? value.defaultView : undefined,
      widgets: Array.isArray(value.widgets)
        ? value.widgets.filter((item): item is string => typeof item === 'string')
        : undefined
    }
  }

  private toMeta(meta?: Prisma.JsonValue | null): Record<string, unknown> | undefined {
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
      return undefined
    }

    return meta as Record<string, unknown>
  }
}
