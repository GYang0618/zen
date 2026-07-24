import { createFileRoute } from '@tanstack/react-router'
import { MessageCircleMore } from 'lucide-react'

import { CopilotChat } from '@/features/ai/copilot'

export const Route = createFileRoute('/_authenticated/_workbench/chat-v2')({
  component: CopilotChat,
  staticData: {
    title: 'Copilot',
    icon: MessageCircleMore,
    order: 30
  }
})
