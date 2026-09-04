import { createFileRoute } from '@tanstack/react-router'
import { Bot } from 'lucide-react'

import { ComingSoon } from '@/components/coming-soon'

export const Route = createFileRoute('/_authenticated/ai/agents')({
  component: ComingSoon,
  staticData: {
    title: 'Agent 中心',
    icon: Bot,
    order: 1
  }
})
