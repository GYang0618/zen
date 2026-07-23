import { createFileRoute } from '@tanstack/react-router'

import { CopilotChat } from '@/features/ai/copilot'

export const Route = createFileRoute('/_authenticated/ai/copilot')({
  component: CopilotChat,
  staticData: {
    title: 'Copilot',
    icon: 'bot-message-square',
    group: '工作台',
    order: 30
  }
})
