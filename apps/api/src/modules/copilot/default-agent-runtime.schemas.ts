import { z } from 'zod'

const MAX_JSON_CHARS = 100_000
const MAX_ARTIFACT_JSON_CHARS = 2_000_000

const boundedJsonSchema = z.unknown().refine(
  (value) => {
    try {
      return JSON.stringify(value ?? null).length <= MAX_JSON_CHARS
    } catch {
      return false
    }
  },
  { message: `JSON payload must not exceed ${MAX_JSON_CHARS} characters` }
)

export const threadListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30)
})

export const threadUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    status: z.enum(['active', 'archived']).optional()
  })
  .refine((value) => value.title !== undefined || value.status !== undefined, {
    message: 'At least one thread field is required'
  })

export const eventListQuerySchema = z.object({
  after: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(1_000).default(200)
})

export const approvalListQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'expired', 'cancelled']).optional()
})

export const approvalDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().trim().min(1).max(1_000).optional()
})

export const memoryUpsertSchema = z.object({
  scope: z.string().trim().min(1).max(64),
  kind: z.string().trim().min(1).max(64),
  key: z.string().trim().min(1).max(128),
  content: boundedJsonSchema,
  threadId: z.string().min(1).max(200).optional(),
  expiresAt: z.string().datetime().optional(),
  sensitivity: z.enum(['private', 'non_sensitive']).optional(),
  shareWithModel: z.boolean().optional(),
  modelProvider: z.literal('qwen').optional()
})

export const evaluationCreateSchema = z.object({
  evaluator: z.string().trim().min(1).max(64),
  metric: z.string().trim().min(1).max(64),
  score: z.number().finite().min(0).max(1),
  details: boundedJsonSchema.optional()
})

export const runListQuerySchema = z.object({
  threadId: z.string().min(1).max(200).optional(),
  status: z
    .enum(['pending', 'running', 'finishing', 'succeeded', 'failed', 'cancelled', 'timed_out', 'interrupted'])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30)
})

export const runResumeSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional()
})

export const artifactCreateSchema = z.object({
  toolCallId: z.string().min(1).max(200).optional(),
  kind: z.string().trim().min(1).max(64).default('tool-result'),
  name: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(1).max(120).default('application/json'),
  summary: z.string().trim().max(2_000).optional(),
  content: z.unknown().refine(
    (value) => {
      try {
        return JSON.stringify(value ?? null).length <= MAX_ARTIFACT_JSON_CHARS
      } catch {
        return false
      }
    },
    { message: `Artifact content must not exceed ${MAX_ARTIFACT_JSON_CHARS} characters` }
  )
})

export type ThreadListQuery = z.infer<typeof threadListQuerySchema>
export type ThreadUpdateInput = z.infer<typeof threadUpdateSchema>
export type EventListQuery = z.infer<typeof eventListQuerySchema>
export type ApprovalListQuery = z.infer<typeof approvalListQuerySchema>
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>
export type MemoryUpsertInput = z.infer<typeof memoryUpsertSchema>
export type EvaluationCreateInput = z.infer<typeof evaluationCreateSchema>
export type RunListQuery = z.infer<typeof runListQuerySchema>
export type RunResumeInput = z.infer<typeof runResumeSchema>
export type ArtifactCreateInput = z.infer<typeof artifactCreateSchema>
