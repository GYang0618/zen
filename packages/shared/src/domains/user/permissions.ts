import { defineKernelPermissions } from '../permission/define-permissions'

export const USER_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'user',
  moduleLabel: '用户管理',
  items: [
    { action: 'list', name: '查看用户列表', description: '分页查询用户列表' },
    { action: 'create', name: '创建用户', description: '创建新用户账号' },
    { action: 'update', name: '编辑用户', description: '更新用户资料' },
    { action: 'delete', name: '删除用户', description: '软删除或物理删除用户' },
    { action: 'status', name: '变更用户状态', description: '批量启用或停用用户' }
  ]
} as const)
