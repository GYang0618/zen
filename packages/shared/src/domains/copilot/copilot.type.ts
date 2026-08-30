import type { z } from 'zod'
import type {
  copilotApprovalDecisionSchema,
  copilotApprovalSchema,
  copilotApprovalStatusSchema,
  copilotArtifactSchema,
  copilotCallSchema,
  copilotCheckpointSchema,
  copilotEvaluationSchema,
  copilotEventPageSchema,
  copilotMemorySchema,
  copilotMessageRoleSchema,
  copilotMessageSchema,
  copilotRunBudgetSchema,
  copilotRunEndReasonSchema,
  copilotRunEventSchema,
  copilotRunEventTypeSchema,
  copilotRunSchema,
  copilotRunStatusSchema,
  copilotThreadSchema,
  copilotToolCallSchema,
  copilotToolCallStatusSchema,
  copilotToolResultSchema,
  copilotTurnSchema
} from './copilot.schema'

export type CopilotCall = z.infer<typeof copilotCallSchema>

/** 与 {@link CopilotCall} 相同，供 Chat 命名空间使用 */
export type ChatCall = CopilotCall

export type CopilotRunStatus = z.infer<typeof copilotRunStatusSchema>
export type CopilotRunEndReason = z.infer<typeof copilotRunEndReasonSchema>
export type CopilotRunEventType = z.infer<typeof copilotRunEventTypeSchema>
export type CopilotRunBudget = z.infer<typeof copilotRunBudgetSchema>
export type CopilotRunEvent = z.infer<typeof copilotRunEventSchema>
export type CopilotRun = z.infer<typeof copilotRunSchema>
export type CopilotTurn = z.infer<typeof copilotTurnSchema>
export type CopilotMessageRole = z.infer<typeof copilotMessageRoleSchema>
export type CopilotMessage = z.infer<typeof copilotMessageSchema>
export type CopilotToolCallStatus = z.infer<typeof copilotToolCallStatusSchema>
export type CopilotToolCall = z.infer<typeof copilotToolCallSchema>
export type CopilotToolResult = z.infer<typeof copilotToolResultSchema>
export type CopilotApprovalStatus = z.infer<typeof copilotApprovalStatusSchema>
export type CopilotApprovalDecision = z.infer<typeof copilotApprovalDecisionSchema>
export type CopilotThread = z.infer<typeof copilotThreadSchema>
export type CopilotEventPage = z.infer<typeof copilotEventPageSchema>
export type CopilotCheckpoint = z.infer<typeof copilotCheckpointSchema>
export type CopilotApproval = z.infer<typeof copilotApprovalSchema>
export type CopilotMemory = z.infer<typeof copilotMemorySchema>
export type CopilotEvaluation = z.infer<typeof copilotEvaluationSchema>
export type CopilotArtifact = z.infer<typeof copilotArtifactSchema>
