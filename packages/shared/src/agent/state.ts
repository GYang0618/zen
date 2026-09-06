import { z } from 'zod'

import {
  copilotApprovalSchema,
  copilotMessageSchema,
  copilotRunEventSchema,
  copilotRunSchema
} from '../domains/copilot/copilot.schema.js'

export const agentEventSchema = copilotRunEventSchema
export const approvalRequestSchema = copilotApprovalSchema
export const agentStateSchema = z.object({
  version: z.literal(1),
  run: copilotRunSchema,
  messages: z.array(copilotMessageSchema),
  approvals: z.array(approvalRequestSchema),
  artifactIds: z.array(z.string().min(1))
})

export type AgentState = z.infer<typeof agentStateSchema>
export type AgentEvent = z.infer<typeof agentEventSchema>
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>
