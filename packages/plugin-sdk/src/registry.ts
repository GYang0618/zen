import type {
  PermissionContribution,
  PluginAgentToolsContribution,
  PluginApiContributionSchema,
  PluginRouteContribution,
  PluginWidgetContribution
} from './manifest.schema'
import type { PluginInstallStatus, PluginRegistryEntry } from './types'

/**
 * 运行时贡献点注册表：按插件启停过滤后供宿主聚合。
 * fail-closed：未显式设为 active 的插件视为 inactive。
 */
export class ContributionRegistry {
  private readonly permissions = new Map<string, PermissionContribution[]>()
  private readonly routes = new Map<string, PluginRouteContribution[]>()
  private readonly apiModules = new Map<string, PluginApiContributionSchema>()
  private readonly agentTools = new Map<string, PluginAgentToolsContribution>()
  private readonly widgets = new Map<string, PluginWidgetContribution[]>()
  private readonly events = new Map<string, string[]>()
  private readonly jobs = new Map<string, string[]>()
  private readonly status = new Map<string, PluginInstallStatus>()

  loadFromRegistry(entries: PluginRegistryEntry[]) {
    for (const entry of entries) {
      this.permissions.set(entry.id, entry.permissions)
      if (entry.routes.length > 0) {
        this.routes.set(entry.id, [...entry.routes])
      }
      if (entry.api) {
        this.apiModules.set(entry.id, entry.api)
      }
      if (entry.agentTools) {
        this.agentTools.set(entry.id, entry.agentTools)
      }
      if (entry.widgets && entry.widgets.length > 0) {
        this.widgets.set(entry.id, [...entry.widgets])
      }
      if (entry.events) {
        this.events.set(entry.id, [...entry.events])
      }
      if (entry.jobs) {
        this.jobs.set(entry.id, [...entry.jobs])
      }
      if (!this.status.has(entry.id)) {
        this.status.set(entry.id, 'inactive')
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
    return [...this.status.entries()].filter(([, status]) => status === 'active').map(([id]) => id)
  }

  getActivePermissions(): PermissionContribution[] {
    return this.listActivePluginIds().flatMap((id) => this.permissions.get(id) ?? [])
  }

  getActiveRoutes(): Array<{ pluginId: string; route: PluginRouteContribution }> {
    return this.listActivePluginIds().flatMap((pluginId) =>
      (this.routes.get(pluginId) ?? []).map((route) => ({ pluginId, route }))
    )
  }

  getActiveApiModules(): Array<{ pluginId: string; api: PluginApiContributionSchema }> {
    return this.listActivePluginIds()
      .filter((id) => this.apiModules.has(id))
      .map((pluginId) => ({ pluginId, api: this.apiModules.get(pluginId)! }))
  }

  getActiveAgentTools(): Array<{ pluginId: string; agentTools: PluginAgentToolsContribution }> {
    return this.listActivePluginIds()
      .filter((id) => this.agentTools.has(id))
      .map((pluginId) => ({ pluginId, agentTools: this.agentTools.get(pluginId)! }))
  }

  getActiveWidgets(): Array<{ pluginId: string; widget: PluginWidgetContribution }> {
    return this.listActivePluginIds().flatMap((pluginId) =>
      (this.widgets.get(pluginId) ?? []).map((widget) => ({ pluginId, widget }))
    )
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

/** 停用插件后贡献点不可见（即使代码仍在仓内）；缺省 status = inactive */
export function filterActiveRegistryEntries(
  entries: PluginRegistryEntry[],
  statusByPluginId: ReadonlyMap<string, PluginInstallStatus>
): PluginRegistryEntry[] {
  return entries.filter((entry) => {
    const status = statusByPluginId.get(entry.id) ?? 'inactive'
    return status === 'active'
  })
}
