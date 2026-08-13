export type PermissionCatalogStatus = 'active' | 'deprecated'

export type PermissionCatalogSource = 'kernel' | `plugin:${string}`

export interface PermissionCatalogEntry {
  code: string
  name: string
  /** 矩阵分组展示名，如「用户管理」 */
  module: string
  resource: string
  action: string
  description?: string
  status: PermissionCatalogStatus
  source: PermissionCatalogSource
}

export interface PermissionItemDef {
  action: string
  name: string
  description?: string
  status?: PermissionCatalogStatus
}
