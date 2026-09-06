import type {
  PermissionContribution,
  PluginAgentToolsContribution,
  PluginApiContributionSchema,
  PluginConfigContribution,
  PluginLifecycleContribution,
  PluginRouteContribution,
  PluginWidgetContribution,
  ZenPluginManifest
} from './manifest.schema.js'

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

/**
 * 插件 API 贡献标记类型；实际 Nest Module class 由插件导出。
 * inject/useFactory 与各插件 forRootAsync 签名对齐（宿主注入 Prisma）。
 */
export interface PluginApiContribution {
  forRootAsync: (options: {
    // Nest DI tokens — 与现有插件 Module 约定一致
    inject: unknown[]
    useFactory: (...args: unknown[]) => { prisma: unknown } | Promise<{ prisma: unknown }>
  }) => unknown
}

export interface PluginLifecycleHooks {
  onEnable?: (ctx: PluginContext) => Promise<void> | void
  onDisable?: (ctx: PluginContext) => Promise<void> | void
}

/**
 * Agent 插件与宿主之间的最小执行契约。插件只声明 OpenAPI operationId，
 * 认证、租户、重试、幂等和错误标准化由 Agent 宿主统一完成。
 */
export interface PluginAgentToolHost<TTool, TConfig, TInput = unknown, TSchema = unknown> {
  createTool: (
    handler: (input: TInput, config: TConfig) => Promise<string>,
    definition: { name: string; description: string; schema: TSchema }
  ) => TTool
  callApi: (operationId: string, options: unknown, config: TConfig) => Promise<string>
}

/** 生成注册表条目（编译期） */
export interface PluginRegistryEntry {
  id: string
  name: string
  version: string
  platformVersion: string
  dependsOn: string[]
  permissions: PermissionContribution[]
  api?: PluginApiContributionSchema
  routes: PluginRouteContribution[]
  config?: PluginConfigContribution
  lifecycle?: PluginLifecycleContribution
  events?: string[]
  widgets?: PluginWidgetContribution[]
  agentTools?: PluginAgentToolsContribution
  jobs?: string[]
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
