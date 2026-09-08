import { defineKernelPermissions } from '../permission/define-permissions.js'

export const PLUGIN_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'plugin',
  moduleLabel: '插件管理',
  items: [
    { action: 'list', name: '查看插件列表', description: '查看已发现插件与安装状态' },
    { action: 'manage', name: '管理插件启停', description: '启用或停用插件' }
  ]
} as const)
