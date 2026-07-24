import { createFileRoute } from '@tanstack/react-router'
import { MessageCircleMore } from 'lucide-react'

import { AICopilot } from '@/features/ai/chat'

export const Route = createFileRoute('/_authenticated/_workbench/chat')({
  component: AICopilot,
  staticData: {
    title: 'Chat',
    icon: MessageCircleMore,
    order: 20,
    hideInMenu: true
  }
})
