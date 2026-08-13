import { Inject, Injectable, Logger } from '@nestjs/common'
import { PermissionStatus, PluginInstallStatus } from '@prisma/client'
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
    const catalogCodes = new Set(catalog.map((entry) => entry.code))

    for (const entry of catalog) {
      await this.prisma.permission.upsert({
        where: { code: entry.code },
        create: toPermissionRow(entry),
        update: {
          name: entry.name,
          module: entry.module,
          resource: entry.resource,
          action: entry.action,
          description: entry.description ?? null,
          status: toPrismaStatus(entry.status),
          source: entry.source
        }
      })
    }

    const orphaned = await this.prisma.permission.updateMany({
      where: {
        code: { notIn: [...catalogCodes] },
        status: { not: PermissionStatus.DEPRECATED }
      },
      data: { status: PermissionStatus.DEPRECATED }
    })

    await this.prisma.role.updateMany({
      where: { isSystem: true, kind: { not: 'SYSTEM' } },
      data: { kind: 'SYSTEM' }
    })

    this.logger.log(
      `Permission catalog synced: kernel=${KERNEL_PERMISSION_CATALOG.length} total=${catalog.length} deprecated orphans=${orphaned.count}`
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

  private async resolveCatalog(tenantId: string): Promise<PermissionCatalogEntry[]> {
    const installations = await this.prisma.pluginInstallation.findMany({
      where: { tenantId },
      select: { pluginId: true, status: true }
    })
    const activePluginIds = new Set(
      installations
        .filter((item) => item.status === PluginInstallStatus.ACTIVE)
        .map((item) => item.pluginId)
    )

    const pluginEntries = PLUGIN_REGISTRY.map((plugin) => {
      const active = activePluginIds.has(plugin.id)
      return plugin.permissions.map((permission) =>
        createPluginPermissionEntry({
          pluginId: plugin.id,
          pluginName: plugin.name,
          code: permission.code,
          name: permission.name,
          description: permission.description,
          status: active ? 'active' : 'deprecated'
        })
      )
    })

    return definePermissionCatalog([KERNEL_PERMISSION_CATALOG, ...pluginEntries])
  }
}

function toPrismaStatus(status: PermissionCatalogEntry['status']): PermissionStatus {
  return status === 'deprecated' ? PermissionStatus.DEPRECATED : PermissionStatus.ACTIVE
}

function toPermissionRow(entry: PermissionCatalogEntry) {
  return {
    code: entry.code,
    name: entry.name,
    module: entry.module,
    resource: entry.resource,
    action: entry.action,
    description: entry.description ?? null,
    status: toPrismaStatus(entry.status),
    source: entry.source
  }
}
