import { Inject, Injectable } from '@nestjs/common'
import { PluginInstallStatus } from '@prisma/client'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'

import type { OnModuleDestroy } from '@nestjs/common'
import type { PluginInstallStatus as SdkStatus } from '@zen/plugin-sdk'

const CACHE_TTL_MS = 5_000

type CacheEntry = {
  expiresAt: number
  statusByPluginId: Map<string, SdkStatus>
  configByPluginId: Map<string, Record<string, unknown> | null>
}

/**
 * 租户插件安装状态读穿缓存。单实例短 TTL；写路径主动失效。
 */
@Injectable()
export class TenantPluginStateService implements OnModuleDestroy {
  private readonly cache = new Map<string, CacheEntry>()

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  onModuleDestroy() {
    this.cache.clear()
  }

  invalidate(tenantId = DEFAULT_TENANT_ID) {
    this.cache.delete(tenantId)
  }

  async getStatus(pluginId: string, tenantId = DEFAULT_TENANT_ID): Promise<SdkStatus> {
    const snapshot = await this.load(tenantId)
    return snapshot.statusByPluginId.get(pluginId) ?? 'inactive'
  }

  async isActive(pluginId: string, tenantId = DEFAULT_TENANT_ID): Promise<boolean> {
    return (await this.getStatus(pluginId, tenantId)) === 'active'
  }

  async getConfig(
    pluginId: string,
    tenantId = DEFAULT_TENANT_ID
  ): Promise<Record<string, unknown> | null> {
    const snapshot = await this.load(tenantId)
    return snapshot.configByPluginId.get(pluginId) ?? null
  }

  async listActiveIds(tenantId = DEFAULT_TENANT_ID): Promise<string[]> {
    const snapshot = await this.load(tenantId)
    return [...snapshot.statusByPluginId.entries()]
      .filter(([, status]) => status === 'active')
      .map(([id]) => id)
  }

  async getStatusMap(tenantId = DEFAULT_TENANT_ID): Promise<Map<string, SdkStatus>> {
    const snapshot = await this.load(tenantId)
    return new Map(snapshot.statusByPluginId)
  }

  private async load(tenantId: string): Promise<CacheEntry> {
    const cached = this.cache.get(tenantId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached
    }

    const installations = await this.prisma.pluginInstallation.findMany({
      where: { tenantId }
    })

    const statusByPluginId = new Map<string, SdkStatus>()
    const configByPluginId = new Map<string, Record<string, unknown> | null>()

    for (const item of installations) {
      statusByPluginId.set(
        item.pluginId,
        item.status === PluginInstallStatus.ACTIVE ? 'active' : 'inactive'
      )
      configByPluginId.set(item.pluginId, (item.config as Record<string, unknown> | null) ?? null)
    }

    const entry: CacheEntry = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      statusByPluginId,
      configByPluginId
    }
    this.cache.set(tenantId, entry)
    return entry
  }
}
