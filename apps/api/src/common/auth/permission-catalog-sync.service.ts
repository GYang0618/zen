import { Inject, Injectable, Logger } from '@nestjs/common'
import { PermissionStatus } from '@prisma/client'
import { PLUGIN_REGISTRY } from '@zen/plugin-sdk'
import {
  createPluginPermissionEntry,
  DEFAULT_TENANT_ID,
  definePermissionCatalog,
  KERNEL_PERMISSION_CATALOG
} from '@zen/shared'

import { AuthContextService } from '@/common/auth/auth-context.service'
import { PrismaService } from '@/infra/prisma'

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { PermissionCatalogEntry } from '@zen/shared'

const EXPIRY_SCAN_INTERVAL_MS = 60 * 60 * 1000

@Injectable()
export class PermissionCatalogSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PermissionCatalogSyncService.name)
  private expiryTimer: ReturnType<typeof setInterval> | undefined

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthContextService) private readonly authContextService: AuthContextService
  ) {}

  async onModuleInit() {
    await this.syncCatalog()
    this.expiryTimer = setInterval(() => {
      void this.scanExpiredRoles()
    }, EXPIRY_SCAN_INTERVAL_MS)
    if (typeof this.expiryTimer.unref === 'function') {
      this.expiryTimer.unref()
    }
  }

  onModuleDestroy() {
    if (this.expiryTimer) clearInterval(this.expiryTimer)
  }

  async syncCatalog(tenantId = DEFAULT_TENANT_ID): Promise<void> {
    const catalog = await this.resolveCatalog(tenantId)
    const activeCatalog = catalog.filter((entry) => entry.status === 'active')
    const activeCodes = new Set(activeCatalog.map((entry) => entry.code))

    for (const entry of activeCatalog) {
      await this.prisma.permission.upsert({
        where: { code: entry.code },
        create: toPermissionRow(entry),
        update: {
          name: entry.name,
          module: entry.module,
          resource: entry.resource,
          action: entry.action,
          description: entry.description ?? null,
          status: PermissionStatus.ACTIVE,
          source: entry.source
        }
      })
    }

    // 目录已废弃或已移除的权限：删除记录（RolePermission 级联清理）
    const removed = await this.prisma.permission.deleteMany({
      where: { code: { notIn: [...activeCodes] } }
    })

    if (removed.count > 0) {
      await this.authContextService.bumpPermVer()
    }

    await this.prisma.role.updateMany({
      where: { isSystem: true, kind: { not: 'SYSTEM' } },
      data: { kind: 'SYSTEM' }
    })

    this.logger.log(
      `Permission catalog synced: kernel=${KERNEL_PERMISSION_CATALOG.length} active=${activeCatalog.length} removed=${removed.count}`
    )
  }

  async scanExpiredRoles(): Promise<void> {
    const now = new Date()
    const expired = await this.prisma.role.findMany({
      where: {
        expiresAt: { lte: now },
        status: 'ACTIVE',
        kind: 'CUSTOM'
      },
      select: { id: true, code: true }
    })

    if (expired.length === 0) return

    await this.authContextService.bumpPermVer()
    this.logger.log(
      `Expired roles detected (${expired.length}): ${expired.map((role) => role.code).join(', ')}; permVer bumped`
    )
  }

  private async resolveCatalog(_tenantId: string): Promise<PermissionCatalogEntry[]> {
    // 权限定义与租户启停分离：目录始终注册编译期权限；可用性由 Guard / 菜单过滤。
    const pluginEntries = PLUGIN_REGISTRY.map((plugin) =>
      plugin.permissions.map((permission) =>
        createPluginPermissionEntry({
          pluginId: plugin.id,
          pluginName: plugin.name,
          code: permission.code,
          name: permission.name,
          description: permission.description,
          status: 'active'
        })
      )
    )

    return definePermissionCatalog([KERNEL_PERMISSION_CATALOG, ...pluginEntries])
  }
}

function toPermissionRow(entry: PermissionCatalogEntry) {
  return {
    code: entry.code,
    name: entry.name,
    module: entry.module,
    resource: entry.resource,
    action: entry.action,
    description: entry.description ?? null,
    status: PermissionStatus.ACTIVE,
    source: entry.source
  }
}
