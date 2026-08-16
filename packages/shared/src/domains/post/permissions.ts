import { defineKernelPermissions } from '../permission/define-permissions'

export const POST_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'post',
  moduleLabel: '岗位管理',
  items: [
    { action: 'list', name: '查看岗位', description: '查询岗位目录与组织编制' },
    { action: 'manage', name: '管理岗位', description: '创建更新停用岗位目录，并管理组织编制关联' }
  ]
} as const)
