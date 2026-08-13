import { defineKernelPermissions } from '../permission/define-permissions'

/** @deprecated 会话已并入个人设置自助能力，权限码仅兼容历史数据 */
export const SESSION_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'session',
  moduleLabel: '会话管理',
  items: [
    {
      action: 'list',
      name: '查看登录会话',
      description: '查看当前用户活跃会话',
      status: 'deprecated'
    },
    {
      action: 'revoke',
      name: '撤销登录会话',
      description: '强制下线指定会话',
      status: 'deprecated'
    }
  ]
} as const)
