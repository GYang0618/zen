import { z } from 'zod'

import { PLUGIN_PERMISSION_CODE_PATTERN, PLUGIN_ROUTE_PATH_PATTERN } from './constants'

export const permissionContributionSchema = z.object({
  code: z.string().regex(PLUGIN_PERMISSION_CODE_PATTERN, '权限码须为 module:resource:action'),
  name: z.string().min(1),
  module: z.string().min(1),
  description: z.string().optional()
})

export const pluginApiContributionSchema = z.object({
  entry: z.string().min(1),
  export: z.string().min(1)
})

export const pluginRouteContributionSchema = z.object({
  id: z.string().min(1),
  path: z
    .string()
    .regex(PLUGIN_ROUTE_PATH_PATTERN, 'route.path 须匹配 /plugins/[a-z0-9-]+'),
  entry: z.string().min(1),
  componentExport: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().min(1),
  order: z.number().optional(),
  permissions: z.array(z.string()).optional()
})

export const pluginConfigContributionSchema = z.object({
  entry: z.string().min(1),
  schemaExport: z.string().min(1)
})

export const pluginLifecycleContributionSchema = z.object({
  entry: z.string().min(1),
  export: z.string().min(1)
})

export const pluginWidgetContributionSchema = z.object({
  id: z.string().min(1),
  slot: z.string().min(1),
  entry: z.string().min(1),
  componentExport: z.string().min(1),
  permissions: z.array(z.string()).optional()
})

export const pluginAgentToolsContributionSchema = z.object({
  entry: z.string().min(1),
  export: z.string().min(1),
  requiredPermissions: z.array(z.string()).default([]),
  toolUi: z
    .array(
      z.object({
        toolName: z.string().min(1),
        entry: z.string().min(1),
        componentExport: z.string().min(1)
      })
    )
    .default([]),
  agentPrompts: z.array(z.string().min(1)).default([])
})

export const zenPluginManifestSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, '插件 id 须为 kebab-case'),
  name: z.string().min(1),
  version: z.string().min(1),
  platformVersion: z.string().min(1),
  dependsOn: z.array(z.string()).default([]),
  permissions: z.array(permissionContributionSchema).default([]),
  api: pluginApiContributionSchema.optional(),
  routes: z.array(pluginRouteContributionSchema).default([]),
  config: pluginConfigContributionSchema.optional(),
  lifecycle: pluginLifecycleContributionSchema.optional(),
  events: z.array(z.string()).optional(),
  widgets: z.array(pluginWidgetContributionSchema).optional(),
  agentTools: pluginAgentToolsContributionSchema.optional(),
  jobs: z.array(z.string()).optional()
})

export type PermissionContribution = z.infer<typeof permissionContributionSchema>
export type PluginApiContributionSchema = z.infer<typeof pluginApiContributionSchema>
export type PluginRouteContribution = z.infer<typeof pluginRouteContributionSchema>
export type PluginConfigContribution = z.infer<typeof pluginConfigContributionSchema>
export type PluginLifecycleContribution = z.infer<typeof pluginLifecycleContributionSchema>
export type PluginWidgetContribution = z.infer<typeof pluginWidgetContributionSchema>
export type PluginAgentToolsContribution = z.infer<typeof pluginAgentToolsContributionSchema>
export type ZenPluginManifest = z.infer<typeof zenPluginManifestSchema>
