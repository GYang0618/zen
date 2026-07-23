import {
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { PluginInstallStatus, type Prisma } from '@prisma/client'
import {
  filterActiveRegistryEntries,
  PLUGIN_REGISTRY
} from '@zen/plugin-sdk'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { AuditService } from '@/common/auth/audit.service'
import { PrismaService } from '@/infra/prisma'

import type { PluginInstallStatus as SdkStatus, PluginRegistryEntry } from '@zen/plugin-sdk'
import type { PluginListItemResponse, PluginListResponse } from './responses/plugin.response'

@Injectable()
export class PluginService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  async list(tenantId = DEFAULT_TENANT_ID): Promise<PluginListResponse> {
    const installations = await this.prisma.pluginInstallation.findMany({
      where: { tenantId }
    })
    const byId = new Map(installations.map((item) => [item.pluginId, item]))

    const items: PluginListItemResponse[] = PLUGIN_REGISTRY.map((entry) => {
      const installation = byId.get(entry.id)
      return {
        id: entry.id,
        name: entry.name,
        version: entry.version,
        platformVersion: entry.platformVersion,
        dependsOn: [...entry.dependsOn],
        packageDir: entry.packageDir,
        permissions: entry.permissions.map((permission) => ({ ...permission })),
        status: toSdkStatus(installation?.status) ?? 'inactive',
        config: (installation?.config as Record<string, unknown> | null) ?? null,
        installed: Boolean(installation)
      }
    })

    return { items }
  }

  async listActiveRegistryEntries(tenantId = DEFAULT_TENANT_ID): Promise<PluginRegistryEntry[]> {
    const installations = await this.prisma.pluginInstallation.findMany({
      where: { tenantId }
    })
    const statusMap = new Map<string, SdkStatus>(
      installations.map((item) => [item.pluginId, toSdkStatus(item.status) ?? 'inactive'])
    )
    for (const entry of PLUGIN_REGISTRY) {
      if (!statusMap.has(entry.id)) {
        statusMap.set(entry.id, 'inactive')
      }
    }
    return filterActiveRegistryEntries([...PLUGIN_REGISTRY], statusMap)
  }

  async activate(pluginId: string, tenantId = DEFAULT_TENANT_ID): Promise<PluginListItemResponse> {
    const entry = findRegistryEntry(pluginId)
    const installation = await this.prisma.pluginInstallation.upsert({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      create: {
        tenantId,
        pluginId,
        version: entry.version,
        status: PluginInstallStatus.ACTIVE
      },
      update: {
        status: PluginInstallStatus.ACTIVE,
        version: entry.version
      }
    })

    await this.auditService.write({
      action: 'system.plugin.activated',
      resource: 'plugin',
      resourceId: pluginId,
      diff: { version: entry.version }
    })

    return toListItem(entry, installation)
  }

  async deactivate(pluginId: string, tenantId = DEFAULT_TENANT_ID): Promise<PluginListItemResponse> {
    const entry = findRegistryEntry(pluginId)
    const existing = await this.prisma.pluginInstallation.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } }
    })
    if (!existing) {
      throw new NotFoundException('插件尚未安装')
    }

    const installation = await this.prisma.pluginInstallation.update({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      data: { status: PluginInstallStatus.INACTIVE }
    })

    await this.auditService.write({
      action: 'system.plugin.deactivated',
      resource: 'plugin',
      resourceId: pluginId,
      diff: { version: entry.version }
    })

    return toListItem(entry, installation)
  }

  async updateConfig(
    pluginId: string,
    config: Record<string, unknown>,
    tenantId = DEFAULT_TENANT_ID
  ): Promise<PluginListItemResponse> {
    const entry = findRegistryEntry(pluginId)
    const existing = await this.prisma.pluginInstallation.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } }
    })
    if (!existing) {
      throw new NotFoundException('插件尚未安装，请先启用')
    }

    const configJson = config as Prisma.InputJsonValue
    const installation = await this.prisma.pluginInstallation.update({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      data: { config: configJson }
    })

    await this.auditService.write({
      action: 'system.plugin.config_updated',
      resource: 'plugin',
      resourceId: pluginId,
      diff: configJson
    })

    return toListItem(entry, installation)
  }
}

function findRegistryEntry(pluginId: string): PluginRegistryEntry {
  const entry = PLUGIN_REGISTRY.find((item) => item.id === pluginId)
  if (!entry) {
    throw new NotFoundException(`未知插件: ${pluginId}`)
  }
  return entry
}

function toSdkStatus(status?: PluginInstallStatus): SdkStatus | undefined {
  if (!status) return undefined
  return status === PluginInstallStatus.ACTIVE ? 'active' : 'inactive'
}

function toListItem(
  entry: PluginRegistryEntry,
  installation: {
    status: PluginInstallStatus
    config: unknown
  }
): PluginListItemResponse {
  return {
    id: entry.id,
    name: entry.name,
    version: entry.version,
    platformVersion: entry.platformVersion,
    dependsOn: [...entry.dependsOn],
    packageDir: entry.packageDir,
    permissions: entry.permissions.map((permission) => ({ ...permission })),
    status: toSdkStatus(installation.status) ?? 'inactive',
    config: (installation.config as Record<string, unknown> | null) ?? null,
    installed: true
  }
}
