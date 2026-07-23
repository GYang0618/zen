import type { ZenPluginManifest } from './manifest.schema'

export type PluginInstallStatus = 'active' | 'inactive'

export interface PluginContext {
  tenantId: string
  config: unknown
  logger: PluginLogger
}

export interface PluginLogger {
  info: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
  error: (message: string, meta?: Record<string, unknown>) => void
}

export interface PluginModule {
  manifest: ZenPluginManifest
  activate?: (ctx: PluginContext) => Promise<void> | void
  deactivate?: (ctx: PluginContext) => Promise<void> | void
}

/** 生成注册表条目（编译期） */
export interface PluginRegistryEntry {
  id: string
  name: string
  version: string
  platformVersion: string
  dependsOn: string[]
  permissions: Array<{
    code: string
    name: string
    module: string
    description?: string
  }>
  contributions: {
    routes?: string
    menus?: string
    widgets?: string
    apiModule?: string
    agentTools?: string
    events?: string[]
    jobs?: string[]
    configSchema?: string
  }
  lifecycle?: {
    activate?: string
    deactivate?: string
  }
  /** 相对 monorepo 根的插件包路径 */
  packageDir: string
}

export interface DiscoveredPlugin {
  dir: string
  manifestPath: string
  manifest: ZenPluginManifest
}

export interface ValidationIssue {
  level: 'error' | 'warning'
  pluginId?: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  issues: ValidationIssue[]
  plugins: DiscoveredPlugin[]
  order: string[]
}
