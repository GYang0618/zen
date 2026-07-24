/** 系统权限码（菜单 / 按钮 / API / Agent Tool 同源） */
export const PermissionCode = {
  USER_LIST: 'system:user:list',
  USER_CREATE: 'system:user:create',
  USER_UPDATE: 'system:user:update',
  USER_DELETE: 'system:user:delete',
  USER_STATUS: 'system:user:status',

  ROLE_LIST: 'system:role:list',
  ROLE_CREATE: 'system:role:create',
  ROLE_UPDATE: 'system:role:update',
  ROLE_DELETE: 'system:role:delete',
  ROLE_ASSIGN: 'system:role:assign',

  ORG_LIST: 'system:org:list',
  ORG_CREATE: 'system:org:create',
  ORG_UPDATE: 'system:org:update',
  ORG_DELETE: 'system:org:delete',

  AUDIT_LIST: 'system:audit:list',
  DICT_LIST: 'system:dict:list',
  DICT_MANAGE: 'system:dict:manage',

  PLUGIN_LIST: 'system:plugin:list',
  PLUGIN_MANAGE: 'system:plugin:manage',

  /** @deprecated 会话已并入个人设置自助能力，权限码仅兼容历史数据 */
  SESSION_LIST: 'system:session:list',
  /** @deprecated 会话已并入个人设置自助能力，权限码仅兼容历史数据 */
  SESSION_REVOKE: 'system:session:revoke',

  POST_LIST: 'system:post:list',
  POST_MANAGE: 'system:post:manage',

  CONFIG_LIST: 'system:config:list',
  CONFIG_MANAGE: 'system:config:manage',

  /** 演示便签插件 */
  DEMO_NOTE_LIST: 'demo:note:list',
  DEMO_NOTE_GET: 'demo:note:get',
  DEMO_NOTE_CREATE: 'demo:note:create',
  DEMO_NOTE_UPDATE: 'demo:note:update',
  DEMO_NOTE_DELETE: 'demo:note:delete',

  /** 通知插件 */
  NOTIF_MESSAGE_LIST: 'notif:message:list',
  NOTIF_MESSAGE_MANAGE: 'notif:message:manage',

  /** 文件插件 */
  FILE_OBJECT_LIST: 'file:object:list',
  FILE_OBJECT_MANAGE: 'file:object:manage',

  /** 任务插件 */
  JOB_TASK_LIST: 'job:task:list',
  JOB_TASK_MANAGE: 'job:task:manage'
} as const

export type PermissionCodeValue = (typeof PermissionCode)[keyof typeof PermissionCode]

export const PERMISSION_CODE_PATTERN = /^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/

export function isPermissionCode(value: string): value is PermissionCodeValue {
  return Object.values(PermissionCode).includes(value as PermissionCodeValue)
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
