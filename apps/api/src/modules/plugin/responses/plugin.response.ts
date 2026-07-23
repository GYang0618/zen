export interface PluginPermissionItem {
  code: string
  name: string
  module: string
  description?: string
}

export interface PluginListItemResponse {
  id: string
  name: string
  version: string
  platformVersion: string
  dependsOn: string[]
  packageDir: string
  permissions: PluginPermissionItem[]
  status: 'active' | 'inactive'
  config: Record<string, unknown> | null
  installed: boolean
}

export interface PluginListResponse {
  items: PluginListItemResponse[]
}
