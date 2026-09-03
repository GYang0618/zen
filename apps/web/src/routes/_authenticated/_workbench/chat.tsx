import { createFileRoute } from '@tanstack/react-router'
import { MessageCircleMore } from 'lucide-react'

import { AgentChat } from '@/features/agent'

export const Route = createFileRoute('/_authenticated/_workbench/chat')({
  component: AgentChat,
  staticData: {
    title: 'AI聊天',
    icon: MessageCircleMore,
    order: 30
  }
})
