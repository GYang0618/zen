import { defineKernelPermissions } from '../permission/define-permissions'

export const ORG_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'org',
  moduleLabel: '组织管理',
  items: [
    { action: 'list', name: '查看组织', description: '查询组织树与成员' },
    { action: 'create', name: '创建组织', description: '创建组织节点' },
    { action: 'update', name: '编辑组织', description: '更新组织信息与结构' },
    { action: 'delete', name: '删除组织', description: '删除组织节点' }
  ]
} as const)

export const POST_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'post',
  moduleLabel: '岗位管理',
  items: [
    { action: 'list', name: '查看岗位', description: '查看组织岗位' },
    { action: 'manage', name: '管理岗位', description: '创建更新删除岗位' }
  ]
} as const)
