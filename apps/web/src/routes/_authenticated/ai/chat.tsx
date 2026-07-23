import { createFileRoute } from '@tanstack/react-router'

import { AICopilot } from '@/features/ai/chat'

export const Route = createFileRoute('/_authenticated/ai/chat')({
  component: AICopilot,
  staticData: {
    title: 'Chat',
    icon: 'message-circle-more',
    group: '工作台',
    order: 20
  }
})
