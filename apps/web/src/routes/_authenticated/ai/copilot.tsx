import { createFileRoute } from '@tanstack/react-router'

import { CopilotChat } from '@/features/ai/copilot'

export const Route = createFileRoute('/_authenticated/ai/copilot')({
  component: CopilotChat
})
