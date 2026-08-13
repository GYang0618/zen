import { AUDIT_PERMISSIONS } from '../audit/permissions'
import { SESSION_PERMISSIONS } from '../auth/permissions'
import { DICT_PERMISSIONS } from '../dict/permissions'
import { ORG_PERMISSIONS, POST_PERMISSIONS } from '../organization/permissions'
import { PLUGIN_PERMISSIONS } from '../plugin/permissions'
import { ROLE_PERMISSIONS } from '../role/permissions'
import { USER_PERMISSIONS } from '../user/permissions'
import { definePermissionCatalog } from './define-permissions'

import type { PermissionCatalogEntry } from './permission.type'

const KERNEL_PERMISSION_GROUPS = [
  USER_PERMISSIONS,
  ROLE_PERMISSIONS,
  ORG_PERMISSIONS,
  POST_PERMISSIONS,
  AUDIT_PERMISSIONS,
  DICT_PERMISSIONS,
  PLUGIN_PERMISSIONS,
  SESSION_PERMISSIONS
] as const

/** 内核权限目录（不含插件；插件由 PLUGIN_REGISTRY 运行时合并） */
export const KERNEL_PERMISSION_CATALOG: readonly PermissionCatalogEntry[] = definePermissionCatalog(
  [...KERNEL_PERMISSION_GROUPS]
)

/** @deprecated 使用 KERNEL_PERMISSION_CATALOG；兼容旧引用 */
export const PERMISSION_CATALOG = KERNEL_PERMISSION_CATALOG

const CATALOG_BY_CODE = new Map(KERNEL_PERMISSION_CATALOG.map((entry) => [entry.code, entry]))

export function getPermissionCatalogEntry(code: string): PermissionCatalogEntry | undefined {
  return CATALOG_BY_CODE.get(code)
}

export function listActivePermissionCodes(): string[] {
  return KERNEL_PERMISSION_CATALOG.filter((entry) => entry.status === 'active').map(
    (entry) => entry.code
  )
}

export function isReadonlyPermissionAction(action: string): boolean {
  return action === 'list' || action === 'query' || action === 'get'
}

export function isReadonlyPermissionCode(code: string): boolean {
  const entry = CATALOG_BY_CODE.get(code)
  if (entry) return isReadonlyPermissionAction(entry.action)
  return /:(read|list|view|get|query)$/i.test(code)
}
