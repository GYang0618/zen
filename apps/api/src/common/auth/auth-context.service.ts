import { Inject, Injectable } from '@nestjs/common'
import { RoleDataScope } from '@prisma/client'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { PrismaService } from '@/infra/prisma'

import type { AuthContext, DataScope } from '@zen/shared'

const DATA_SCOPE_RANK: Record<DataScope, number> = {
  self: 1,
  org: 2,
  org_and_child: 3,
  custom: 3,
  all: 4
}

function toDataScope(scope: RoleDataScope): DataScope {
  switch (scope) {
    case RoleDataScope.ALL:
      return 'all'
    case RoleDataScope.ORGANIZATION:
      // 现有枚举 ORGANIZATION 语义对齐为「本组织及下级」
      return 'org_and_child'
    case RoleDataScope.CUSTOM:
      return 'custom'
    default:
      return 'self'
  }
}

function pickWidestDataScope(scopes: DataScope[]): DataScope {
  if (scopes.length === 0) return 'self'
  return scopes.reduce((widest, current) =>
    DATA_SCOPE_RANK[current] > DATA_SCOPE_RANK[widest] ? current : widest
  )
}

@Injectable()
export class AuthContextService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async resolve(userId: string): Promise<AuthContext> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    })

    const primaryMembership = await this.prisma.userOrganization.findFirst({
      where: { userId, isPrimary: true, leftAt: null },
      include: { organization: true }
    })

    const memberships = await this.prisma.userOrganization.findMany({
      where: { userId, leftAt: null },
      select: { organizationId: true }
    })

    const roles = userRoles.map((item) => item.role.code)
    const permissions = [
      ...new Set(userRoles.flatMap((item) => item.role.permissions.map((rp) => rp.permission.code)))
    ]
    const dataScopes = userRoles.map((item) => toDataScope(item.role.dataScope))
    const dataScope = pickWidestDataScope(dataScopes)
    const customOrgIds = [
      ...new Set(
        userRoles
          .filter((item) => item.role.dataScope === RoleDataScope.CUSTOM)
          .flatMap((item) => item.role.customOrgIds)
      )
    ]
    const permVer = await this.readPermVer()

    return {
      tenantId: DEFAULT_TENANT_ID,
      userId,
      roles,
      permissions,
      dataScope,
      customOrgIds: customOrgIds.length > 0 ? customOrgIds : undefined,
      orgIds: memberships.map((item) => item.organizationId),
      primaryOrgId: primaryMembership?.organizationId,
      primaryOrgPath: primaryMembership?.organization.path ?? undefined,
      permVer
    }
  }

  async bumpPermVer(): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: DEFAULT_TENANT_ID } })
    const settings =
      tenant?.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings)
        ? (tenant.settings as Record<string, unknown>)
        : {}
    const next = (typeof settings.permVer === 'number' ? settings.permVer : 1) + 1
    await this.prisma.tenant.update({
      where: { id: DEFAULT_TENANT_ID },
      data: { settings: { ...settings, permVer: next } }
    })
    return next
  }

  async readPermVer(): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: DEFAULT_TENANT_ID } })
    if (!tenant?.settings || typeof tenant.settings !== 'object' || Array.isArray(tenant.settings)) {
      return 1
    }
    const settings = tenant.settings as Record<string, unknown>
    return typeof settings.permVer === 'number' ? settings.permVer : 1
  }
}
