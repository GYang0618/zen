import { Inject, Injectable } from '@nestjs/common'
import { RecordStatus, RoleDataScope } from '@prisma/client'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { PrismaService } from '@/infra/prisma'

import type { RoleKind } from '@prisma/client'
import type { AuthContext, DataScope } from '@zen/shared'

const DATA_SCOPE_RANK: Record<DataScope, number> = {
  self: 1,
  org: 2,
  custom: 3,
  org_and_child: 4,
  all: 5
}

const SUPER_ADMIN_ROLE_CODE = 'super_admin'
const SNAPSHOT_CACHE_MAX = 500

function toDataScope(scope: RoleDataScope): DataScope {
  switch (scope) {
    case RoleDataScope.ALL:
      return 'all'
    case RoleDataScope.ORGANIZATION:
      return 'org_and_child'
    case RoleDataScope.ORGANIZATION_ONLY:
      return 'org'
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

function isRoleEffective(role: {
  status: RecordStatus
  kind: RoleKind
  expiresAt: Date | null
  code: string
}): boolean {
  if (role.status !== RecordStatus.ACTIVE) return false
  if (role.expiresAt && role.expiresAt.getTime() <= Date.now()) return false
  return true
}

@Injectable()
export class AuthContextService {
  private readonly snapshotCache = new Map<string, AuthContext>()

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async resolve(userId: string): Promise<AuthContext> {
    const permVer = await this.readPermVer()
    const cacheKey = `${userId}:${permVer}`
    const cached = this.snapshotCache.get(cacheKey)
    if (cached) return cached

    const auth = await this.loadAuthContext(userId, permVer)
    this.putCache(cacheKey, auth)
    return auth
  }

  invalidateCache(userId?: string): void {
    if (!userId) {
      this.snapshotCache.clear()
      return
    }
    for (const key of this.snapshotCache.keys()) {
      if (key.startsWith(`${userId}:`)) this.snapshotCache.delete(key)
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
    this.snapshotCache.clear()
    return next
  }

  async readPermVer(): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: DEFAULT_TENANT_ID } })
    if (
      !tenant?.settings ||
      typeof tenant.settings !== 'object' ||
      Array.isArray(tenant.settings)
    ) {
      return 1
    }
    const settings = tenant.settings as Record<string, unknown>
    return typeof settings.permVer === 'number' ? settings.permVer : 1
  }

  private async loadAuthContext(userId: string, permVer: number): Promise<AuthContext> {
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

    const effectiveRoles = userRoles
      .map((item) => item.role)
      .filter((role) => isRoleEffective(role))

    const isAdmin = effectiveRoles.some((role) => role.code === SUPER_ADMIN_ROLE_CODE)
    const roles = effectiveRoles.map((role) => role.code)
    const permissions = isAdmin
      ? []
      : [
          ...new Set(
            effectiveRoles.flatMap((role) =>
              role.permissions
                .filter((rp) => rp.permission.status === 'ACTIVE')
                .map((rp) => rp.permission.code)
            )
          )
        ]
    const dataScopes = effectiveRoles.map((role) => toDataScope(role.dataScope))
    const dataScope = isAdmin ? 'all' : pickWidestDataScope(dataScopes)
    const customOrgIds = [
      ...new Set(
        effectiveRoles
          .filter((role) => role.dataScope === RoleDataScope.CUSTOM)
          .flatMap((role) => role.customOrgIds)
      )
    ]

    return {
      tenantId: DEFAULT_TENANT_ID,
      userId,
      roles,
      permissions,
      isAdmin,
      dataScope,
      customOrgIds: customOrgIds.length > 0 ? customOrgIds : undefined,
      orgIds: memberships.map((item) => item.organizationId),
      primaryOrgId: primaryMembership?.organizationId,
      primaryOrgPath: primaryMembership?.organization.path ?? undefined,
      permVer
    }
  }

  private putCache(key: string, value: AuthContext): void {
    if (this.snapshotCache.size >= SNAPSHOT_CACHE_MAX) {
      const oldest = this.snapshotCache.keys().next().value
      if (oldest) this.snapshotCache.delete(oldest)
    }
    this.snapshotCache.set(key, value)
  }
}
