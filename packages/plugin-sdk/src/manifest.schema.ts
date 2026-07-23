import { z } from 'zod'

import { PLUGIN_PERMISSION_CODE_PATTERN } from './constants'

export const permissionContributionSchema = z.object({
  code: z
    .string()
    .regex(PLUGIN_PERMISSION_CODE_PATTERN, '权限码须为 module:resource:action'),
  name: z.string().min(1),
  module: z.string().min(1),
  description: z.string().optional()
})

export const pluginContributionsSchema = z.object({
  permissions: z.array(permissionContributionSchema).default([]),
  routes: z.string().optional(),
  menus: z.string().optional(),
  widgets: z.string().optional(),
  apiModule: z.string().optional(),
  agentTools: z.string().optional(),
  events: z.array(z.string()).optional(),
  jobs: z.array(z.string()).optional(),
  configSchema: z.string().optional()
})

export const pluginLifecycleSchema = z.object({
  activate: z.string().optional(),
  deactivate: z.string().optional()
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
  contributions: pluginContributionsSchema.default({ permissions: [] }),
  lifecycle: pluginLifecycleSchema.optional()
})

export type PermissionContribution = z.infer<typeof permissionContributionSchema>
export type PluginContributions = z.infer<typeof pluginContributionsSchema>
export type ZenPluginManifest = z.infer<typeof zenPluginManifestSchema>
