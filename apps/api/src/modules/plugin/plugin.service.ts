import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { PluginInstallStatus } from '@prisma/client'
import { filterActiveRegistryEntries, PLUGIN_REGISTRY } from '@zen/plugin-sdk'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { AuditService } from '@/common/auth/audit.service'
import { AuthContextService } from '@/common/auth/auth-context.service'
import { PermissionCatalogSyncService } from '@/common/auth/permission-catalog-sync.service'
import { PLUGIN_CONFIG_SCHEMAS } from '@/generated/plugin-config.gen'
import { PLUGIN_LIFECYCLE_HOOKS } from '@/generated/plugin-lifecycle.gen'
import { PrismaService } from '@/infra/prisma'

import { TenantPluginStateService } from './tenant-plugin-state.service'

import type { Prisma } from '@prisma/client'
import type {
  PluginContext,
  PluginRegistryEntry,
  PluginInstallStatus as SdkStatus
} from '@zen/plugin-sdk'
import type { PluginListItemResponse, PluginListResponse } from './responses/plugin.response'

@Injectable()
export class PluginService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(PermissionCatalogSyncService)
    private readonly permissionCatalogSync: PermissionCatalogSyncService,
    @Inject(AuthContextService) private readonly authContextService: AuthContextService,
    @Inject(TenantPluginStateService) private readonly pluginState: TenantPluginStateService
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
    const statusMap = await this.pluginState.getStatusMap(tenantId)
    for (const entry of PLUGIN_REGISTRY) {
      if (!statusMap.has(entry.id)) {
        statusMap.set(entry.id, 'inactive')
      }
    }
    return filterActiveRegistryEntries([...PLUGIN_REGISTRY], statusMap)
  }

  async activate(pluginId: string, tenantId = DEFAULT_TENANT_ID): Promise<PluginListItemResponse> {
    const entry = findRegistryEntry(pluginId)
    await this.assertDependenciesActive(entry, tenantId)

    const defaults = this.parseConfig(pluginId, {})
    const installation = await this.prisma.pluginInstallation.upsert({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      create: {
        tenantId,
        pluginId,
        version: entry.version,
        status: PluginInstallStatus.ACTIVE,
        config: defaults as Prisma.InputJsonValue
      },
      update: {
        status: PluginInstallStatus.ACTIVE,
        version: entry.version
      }
    })

    await this.runLifecycle(pluginId, 'onEnable', tenantId, installation.config)
    await this.auditService.write({
      action: 'system.plugin.activated',
      resource: 'plugin',
      resourceId: pluginId,
      diff: { version: entry.version }
    })
    await this.afterStateChange(tenantId)

    return toListItem(entry, installation)
  }

  async deactivate(
    pluginId: string,
    tenantId = DEFAULT_TENANT_ID
  ): Promise<PluginListItemResponse> {
    const entry = findRegistryEntry(pluginId)
    const existing = await this.prisma.pluginInstallation.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } }
    })
    if (!existing) {
      throw new NotFoundException('插件尚未安装')
    }

    await this.assertNoActiveDependents(pluginId, tenantId)

    const installation = await this.prisma.pluginInstallation.update({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      data: { status: PluginInstallStatus.INACTIVE }
    })

    await this.runLifecycle(pluginId, 'onDisable', tenantId, installation.config)
    await this.auditService.write({
      action: 'system.plugin.deactivated',
      resource: 'plugin',
      resourceId: pluginId,
      diff: { version: entry.version }
    })
    await this.afterStateChange(tenantId)

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

    const parsed = this.parseConfig(pluginId, config)
    const installation = await this.prisma.pluginInstallation.update({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      data: { config: parsed as Prisma.InputJsonValue }
    })

    await this.auditService.write({
      action: 'system.plugin.config_updated',
      resource: 'plugin',
      resourceId: pluginId,
      diff: parsed as Prisma.InputJsonValue
    })
    this.pluginState.invalidate(tenantId)

    return toListItem(entry, installation)
  }

  private parseConfig(pluginId: string, config: Record<string, unknown>): Record<string, unknown> {
    const schema = PLUGIN_CONFIG_SCHEMAS[pluginId as keyof typeof PLUGIN_CONFIG_SCHEMAS]
    if (!schema) {
      if (Object.keys(config).length > 0) {
        throw new BadRequestException(`插件 ${pluginId} 不接受配置`)
      }
      return {}
    }

    const result = schema.safeParse(config)
    if (!result.success) {
      throw new BadRequestException({
        message: '插件配置校验失败',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      })
    }

    return result.data as Record<string, unknown>
  }

  private async assertDependenciesActive(entry: PluginRegistryEntry, tenantId: string) {
    if (entry.dependsOn.length === 0) return
    const missing: string[] = []
    for (const dep of entry.dependsOn) {
      const active = await this.pluginState.isActive(dep, tenantId)
      if (!active) missing.push(dep)
    }
    if (missing.length > 0) {
      throw new ConflictException({
        message: '依赖插件未启用',
        missingDependencies: missing
      })
    }
  }

  private async assertNoActiveDependents(pluginId: string, tenantId: string) {
    const dependents = PLUGIN_REGISTRY.filter((entry) =>
      (entry.dependsOn as readonly string[]).includes(pluginId)
    )
    const activeDependents: string[] = []
    for (const dependent of dependents) {
      if (await this.pluginState.isActive(dependent.id, tenantId)) {
        activeDependents.push(dependent.id)
      }
    }
    if (activeDependents.length > 0) {
      throw new ConflictException({
        message: '存在依赖此插件的已启用插件，无法停用',
        activeDependents
      })
    }
  }

  private async runLifecycle(
    pluginId: string,
    hook: 'onEnable' | 'onDisable',
    tenantId: string,
    config: unknown
  ) {
    const hooks = PLUGIN_LIFECYCLE_HOOKS[pluginId as keyof typeof PLUGIN_LIFECYCLE_HOOKS]
    const fn = hooks?.[hook]
    if (!fn) return

    const ctx: PluginContext = {
      tenantId,
      config,
      logger: {
        info: (message, meta) => console.info(`[plugin:${pluginId}] ${message}`, meta ?? {}),
        warn: (message, meta) => console.warn(`[plugin:${pluginId}] ${message}`, meta ?? {}),
        error: (message, meta) => console.error(`[plugin:${pluginId}] ${message}`, meta ?? {})
      }
    }
    await fn(ctx)
  }

  private async afterStateChange(tenantId: string) {
    this.pluginState.invalidate(tenantId)
    await this.permissionCatalogSync.syncCatalog(tenantId)
    await this.authContextService.bumpPermVer()
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
