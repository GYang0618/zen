import { defineKernelPermissions } from '../permission/define-permissions'

export const CONFIG_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'config',
  moduleLabel: '系统配置',
  items: [
    { action: 'list', name: '查看系统配置', description: '查看站点配置' },
    { action: 'manage', name: '管理系统配置', description: '更新站点配置' }
  ]
} as const)
