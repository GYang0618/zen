import { createFileRoute } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'

import { AiQuotaPage } from '@/features/system/ai-quota'

export const Route = createFileRoute('/_authenticated/system/ai-quota')({
  component: AiQuotaPage,
  staticData: {
    title: 'AI 配额治理',
    description: '治理 AI Agent 运行用量限额、超额硬阻断与多模型版本化计价表',
    icon: Sparkles,
    order: 51,
    permissions: ['system:ai-quota:list']
  }
})
