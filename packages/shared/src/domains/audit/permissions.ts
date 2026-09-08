import { defineKernelPermissions } from '../permission/define-permissions.js'

export const AUDIT_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'audit',
  moduleLabel: '审计',
  items: [{ action: 'list', name: '查看审计日志', description: '查询操作与登录审计' }]
} as const)
