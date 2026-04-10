import { createFileRoute } from '@tanstack/react-router'
import { AICopilot } from '@/features/ai/copilot'

export const Route = createFileRoute('/_authenticated/ai/copilot')({
  component: AICopilot
})
