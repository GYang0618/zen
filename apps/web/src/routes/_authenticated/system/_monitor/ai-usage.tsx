import { createFileRoute } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import { Bot } from 'lucide-react'

import { AiUsagePage } from '@/features/system/audit'

export const Route = createFileRoute('/_authenticated/system/_monitor/ai-usage')({
  component: AiUsagePage,
  staticData: {
    title: 'AI用量治理',
    description: '统计 AI Agent 任务流水、Token 消耗分布与多模型费用明细',
    icon: Bot,
    order: 40,
    permissions: [PermissionCode.AUDIT_AGENT, PermissionCode.AUDIT_LIST]
  }
})
