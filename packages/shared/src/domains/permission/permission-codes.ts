import { AUDIT_PERMISSIONS } from '../audit/permissions'
import { SESSION_PERMISSIONS } from '../auth/permissions'
import { DICT_PERMISSIONS } from '../dict/permissions'
import { ORG_PERMISSIONS, POST_PERMISSIONS } from '../organization/permissions'
import { PLUGIN_PERMISSIONS } from '../plugin/permissions'
import { ROLE_PERMISSIONS } from '../role/permissions'
import { USER_PERMISSIONS } from '../user/permissions'

import type { KERNEL_PERMISSION_CATALOG } from './catalog'

/** 系统权限码（菜单 / 按钮 / API / Agent Tool 同源），由各模块 permissions 聚合 */
export const PermissionCode = {
  ...USER_PERMISSIONS.codes,
  ...ROLE_PERMISSIONS.codes,
  ...ORG_PERMISSIONS.codes,
  ...POST_PERMISSIONS.codes,
  ...AUDIT_PERMISSIONS.codes,
  ...DICT_PERMISSIONS.codes,
  ...PLUGIN_PERMISSIONS.codes,
  ...SESSION_PERMISSIONS.codes
} as const satisfies Record<string, (typeof KERNEL_PERMISSION_CATALOG)[number]['code']>

export type PermissionCodeValue = (typeof PermissionCode)[keyof typeof PermissionCode]

export { PERMISSION_CODE_PATTERN } from './define-permissions'

const PERMISSION_CODE_SET = new Set<string>(Object.values(PermissionCode))

export function isPermissionCode(value: string): value is PermissionCodeValue {
  return PERMISSION_CODE_SET.has(value)
}

export function hasAllPermissions(
  granted: readonly string[],
  required: readonly string[]
): boolean {
  if (required.length === 0) return true
  const set = new Set(granted)
  return required.every((code) => set.has(code))
}

export function hasAnyPermission(granted: readonly string[], required: readonly string[]): boolean {
  if (required.length === 0) return true
  const set = new Set(granted)
  return required.some((code) => set.has(code))
}
