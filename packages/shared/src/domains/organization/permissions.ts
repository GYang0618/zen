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

/** @deprecated 请从 `@zen/shared` 的 post domain 导入；此处再导出以保持兼容 */
export { POST_PERMISSIONS } from '../post/permissions'
