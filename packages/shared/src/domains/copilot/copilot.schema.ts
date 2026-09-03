import { z } from 'zod'

import type { UIMessage } from 'ai'

export const copilotCallSchema = z.object({
  id: z.string().optional(),
  messages: z.custom<UIMessage[]>(),
  /**
   * 是否开启模型的“思考/推理”模式。
   * 默认关闭：不向模型请求 reasoning 相关能力。
   */
  enableThinking: z.boolean().optional().default(false)
})

/** 与 {@link copilotCallSchema} 相同，供 Chat 命名空间使用 */
export const chatCallSchema = copilotCallSchema

export const copilotRunStatusSchema = z.enum([
  'pending',
  'running',
  'finishing',
  'succeeded',
  'failed',
  'cancelled',
  'timed_out',
  'interrupted'
])

export const copilotRunEndReasonSchema = z.enum([
  'completed',
  'tool_error',
  'model_error',
  'validation_error',
  'budget_exceeded',
  'timeout',
  'cancelled',
  'disconnected',
  'interrupted'
])

export const copilotRunEventTypeSchema = z.enum([
  'run.started',
  'run.finished',
  'run.error',
  'turn.started',
  'turn.finished',
  'message.started',
  'message.delta',
  'message.finished',
  'reasoning.started',
  'reasoning.delta',
  'reasoning.finished',
  'activity.started',
  'activity.finished',
  'tool.call.started',
  'tool.call.args',
  'tool.call.finished',
  'tool.call.result'
])

export const copilotMessageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool'])

export const copilotToolCallStatusSchema = z.enum([
  'pending',
  'running',
  'succeeded',
  'failed',
  'cancelled'
])

export const copilotRunBudgetSchema = z.object({
  recursionLimit: z.number().int().positive(),
  maxModelCalls: z.number().int().positive(),
  maxTotalTokens: z.number().int().positive(),
  maxFailures: z.number().int().positive(),
  maxOutputTokensPerModelCall: z.number().int().positive(),
  timeoutMs: z.number().int().positive()
})

export const copilotRunEventSchema = z.object({
  runId: z.string().min(1),
  turnId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  type: copilotRunEventTypeSchema,
  status: copilotRunStatusSchema.optional(),
  endReason: copilotRunEndReasonSchema.optional(),
  messageId: z.string().optional(),
  toolCallId: z.string().optional(),
  toolName: z.string().optional(),
  delta: z.string().optional(),
  payload: z.unknown().optional(),
  createdAt: z.iso.datetime()
})

/** 默认预算的结构校验器，供配置加载和测试复用。 */
export const defaultAgentRunBudgetSchema = copilotRunBudgetSchema

export const copilotRunSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  status: copilotRunStatusSchema,
  budget: copilotRunBudgetSchema,
  currentTurnId: z.string().optional(),
  endReason: copilotRunEndReasonSchema.optional(),
  startedAt: z.iso.datetime().optional(),
  endedAt: z.iso.datetime().optional()
})

export const copilotTurnSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  status: copilotRunStatusSchema,
  endReason: copilotRunEndReasonSchema.optional(),
  startedAt: z.iso.datetime().optional(),
  endedAt: z.iso.datetime().optional()
})

/** reasoning/activity 是展示事件，不属于可回传模型的 Message。 */
export const copilotMessageSchema = z.object({
  id: z.string().min(1),
  turnId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  role: copilotMessageRoleSchema,
  content: z.string(),
  toolCallId: z.string().optional()
})

export const copilotToolCallSchema = z.object({
  id: z.string().min(1),
  turnId: z.string().min(1),
  messageId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  name: z.string().min(1),
  arguments: z.unknown(),
  status: copilotToolCallStatusSchema
})

export const copilotToolResultSchema = z.discriminatedUnion('success', [
  z.object({
    toolCallId: z.string().min(1),
    success: z.literal(true),
    data: z.unknown().optional()
  }),
  z.object({
    toolCallId: z.string().min(1),
    success: z.literal(false),
    reason: z.string().min(1),
    message: z.string().min(1),
    data: z.unknown().optional()
  })
])

export const copilotApprovalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'expired',
  'cancelled'
])

export const copilotApprovalDecisionSchema = z.enum(['approve', 'reject'])

export const copilotThreadSchema = z.object({
  id: z.string().min(1),
  agentId: z.literal('default_agent'),
  title: z.string().nullable(),
  status: z.enum(['active', 'archived']),
  lastMessageAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const copilotEventPageSchema = z.object({
  items: z.array(copilotRunEventSchema),
  cursor: z.number().int().nonnegative(),
  hasMore: z.boolean()
})

export const copilotCheckpointSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  runId: z.string().min(1),
  version: z.number().int().nonnegative(),
  state: z.unknown(),
  summary: z.string().nullable()
})

export const copilotApprovalSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  interruptId: z.string().min(1),
  toolCallId: z.string().min(1),
  toolName: z.string().min(1),
  arguments: z.unknown(),
  argumentsHash: z.string().length(64),
  status: copilotApprovalStatusSchema,
  decision: copilotApprovalDecisionSchema.nullable(),
  reason: z.string().nullable(),
  expiresAt: z.iso.datetime()
})

export const copilotMemorySchema = z.object({
  id: z.string().min(1),
  threadId: z.string().nullable(),
  scope: z.string().min(1),
  kind: z.string().min(1),
  key: z.string().min(1),
  content: z.unknown(),
  sensitivity: z.enum(['private', 'non_sensitive']),
  shareWithModel: z.boolean(),
  modelProvider: z.literal('qwen').nullable(),
  approvedForModelAt: z.iso.datetime().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const copilotEvaluationSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  evaluator: z.string().min(1),
  metric: z.string().min(1),
  score: z.number().min(0).max(1),
  details: z.unknown().optional(),
  createdAt: z.iso.datetime()
})

export const copilotArtifactSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  threadId: z.string().min(1),
  toolExecutionId: z.string().nullable(),
  kind: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  summary: z.string().nullable(),
  status: z.enum(['available', 'expired', 'deleted']),
  createdAt: z.iso.datetime()
})
