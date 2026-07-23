import type { PermissionContribution } from './manifest.schema'
import type { PluginInstallStatus, PluginRegistryEntry } from './types'

/**
 * 运行时贡献点注册表：按插件启停过滤后供宿主聚合。
 */
export class ContributionRegistry {
  private readonly permissions = new Map<string, PermissionContribution[]>()
  private readonly routes = new Map<string, string>()
  private readonly apiModules = new Map<string, string>()
  private readonly agentTools = new Map<string, string>()
  private readonly widgets = new Map<string, string>()
  private readonly events = new Map<string, string[]>()
  private readonly jobs = new Map<string, string[]>()
  private readonly status = new Map<string, PluginInstallStatus>()

  loadFromRegistry(entries: PluginRegistryEntry[]) {
    for (const entry of entries) {
      this.permissions.set(entry.id, entry.permissions)
      if (entry.contributions.routes) {
        this.routes.set(entry.id, entry.contributions.routes)
      }
      if (entry.contributions.apiModule) {
        this.apiModules.set(entry.id, entry.contributions.apiModule)
      }
      if (entry.contributions.agentTools) {
        this.agentTools.set(entry.id, entry.contributions.agentTools)
      }
      if (entry.contributions.widgets) {
        this.widgets.set(entry.id, entry.contributions.widgets)
      }
      if (entry.contributions.events) {
        this.events.set(entry.id, [...entry.contributions.events])
      }
      if (entry.contributions.jobs) {
        this.jobs.set(entry.id, [...entry.contributions.jobs])
      }
      if (!this.status.has(entry.id)) {
        this.status.set(entry.id, 'active')
      }
    }
  }

  setStatus(pluginId: string, status: PluginInstallStatus) {
    this.status.set(pluginId, status)
  }

  getStatus(pluginId: string): PluginInstallStatus {
    return this.status.get(pluginId) ?? 'inactive'
  }

  isActive(pluginId: string): boolean {
    return this.getStatus(pluginId) === 'active'
  }

  listActivePluginIds(): string[] {
    return [...this.status.entries()]
      .filter(([, status]) => status === 'active')
      .map(([id]) => id)
  }

  getActivePermissions(): PermissionContribution[] {
    return this.listActivePluginIds().flatMap((id) => this.permissions.get(id) ?? [])
  }

  getActiveRoutes(): Array<{ pluginId: string; path: string }> {
    return this.listActivePluginIds()
      .filter((id) => this.routes.has(id))
      .map((pluginId) => ({ pluginId, path: this.routes.get(pluginId)! }))
  }

  getActiveApiModules(): Array<{ pluginId: string; path: string }> {
    return this.listActivePluginIds()
      .filter((id) => this.apiModules.has(id))
      .map((pluginId) => ({ pluginId, path: this.apiModules.get(pluginId)! }))
  }

  getActiveAgentTools(): Array<{ pluginId: string; path: string }> {
    return this.listActivePluginIds()
      .filter((id) => this.agentTools.has(id))
      .map((pluginId) => ({ pluginId, path: this.agentTools.get(pluginId)! }))
  }

  getActiveWidgets(): Array<{ pluginId: string; path: string }> {
    return this.listActivePluginIds()
      .filter((id) => this.widgets.has(id))
      .map((pluginId) => ({ pluginId, path: this.widgets.get(pluginId)! }))
  }

  getActiveEvents(): Array<{ pluginId: string; events: string[] }> {
    return this.listActivePluginIds()
      .filter((id) => this.events.has(id))
      .map((pluginId) => ({ pluginId, events: this.events.get(pluginId) ?? [] }))
  }

  getActiveJobs(): Array<{ pluginId: string; jobs: string[] }> {
    return this.listActivePluginIds()
      .filter((id) => this.jobs.has(id))
      .map((pluginId) => ({ pluginId, jobs: this.jobs.get(pluginId) ?? [] }))
  }
}

/** 停用插件后贡献点不可见（即使代码仍在仓内） */
export function filterActiveRegistryEntries(
  entries: PluginRegistryEntry[],
  statusByPluginId: ReadonlyMap<string, PluginInstallStatus>
): PluginRegistryEntry[] {
  return entries.filter((entry) => {
    const status = statusByPluginId.get(entry.id) ?? 'active'
    return status === 'active'
  })
}
