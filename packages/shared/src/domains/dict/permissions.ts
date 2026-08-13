import { defineKernelPermissions } from '../permission/define-permissions'

export const DICT_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'dict',
  moduleLabel: '系统配置',
  items: [
    { action: 'list', name: '查看字典', description: '查询系统字典' },
    { action: 'manage', name: '管理字典', description: '维护系统字典' }
  ]
} as const)
