import { defineKernelPermissions } from '../permission/define-permissions.js'

export const ROLE_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'role',
  moduleLabel: '角色管理',
  items: [
    { action: 'list', name: '查看角色列表', description: '分页查询角色列表' },
    { action: 'create', name: '创建角色', description: '创建自定义角色' },
    { action: 'update', name: '编辑角色', description: '更新角色信息与权限' },
    { action: 'delete', name: '删除角色', description: '删除自定义角色' },
    { action: 'assign', name: '分配角色成员', description: '为角色绑定或解绑用户' }
  ]
} as const)
