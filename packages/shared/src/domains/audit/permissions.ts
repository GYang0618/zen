import { defineKernelPermissions } from '../permission/define-permissions.js'

export const AUDIT_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'audit',
  moduleLabel: '审计',
  items: [
    { action: 'list', name: '查看审计日志', description: '查询操作审计列表' },
    { action: 'detail', name: '查看审计详情', description: '查看操作审计 diff 与元数据' },
    { action: 'export', name: '导出审计日志', description: '导出操作和访问审计日志' },
    { action: 'login', name: '查看登录日志', description: '查询系统登录历史' },
    { action: 'access', name: '查看接口访问', description: '查询接口访问审计与性能指标' },
    { action: 'agent', name: '查看 AI 用量', description: '查看 Agent 执行与 Token 用量' },
    {
      action: 'agent-content',
      name: '查看 AI 对话内容',
      description: '查看 Agent 交互完整消息正文'
    }
  ]
} as const)

export const AI_QUOTA_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'ai-quota',
  moduleLabel: '模型与配额',
  items: [
    { action: 'list', name: '查看 AI 配额', description: '查询租户与主体 AI 配额' },
    { action: 'manage', name: '管理 AI 配额', description: '配置 AI 配额与限额规则' }
  ]
} as const)

export const AI_PRICE_PERMISSIONS = defineKernelPermissions({
  namespace: 'system',
  resource: 'ai-price',
  moduleLabel: '模型与配额',
  items: [{ action: 'manage', name: '管理模型价格', description: '配置与发布 AI 模型单价版本' }]
} as const)
