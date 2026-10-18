import { createFileRoute } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import { Bot } from 'lucide-react'

import { AgentRunDetailPage } from '@/features/system/audit'

export const Route = createFileRoute('/_authenticated/system/_monitor/ai-usage_/$id')({
  component: AgentRunDetailPage,
  staticData: {
    title: 'Agent 任务详情',
    description: '查看 Agent 执行任务流水、分步模型调用与关联审计轨迹',
    icon: Bot,
    hideInMenu: true,
    permissions: [PermissionCode.AUDIT_AGENT, PermissionCode.AUDIT_LIST]
  }
})
