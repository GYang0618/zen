import { createFileRoute } from '@tanstack/react-router'

import { CopilotChat } from '@/features/ai/copilotkit'
export const Route = createFileRoute('/_authenticated/ai/copilot')({
  component: CopilotChat
})
