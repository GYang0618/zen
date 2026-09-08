import { z } from 'zod'

import { idSchema } from '../primitives/index.js'

export const agentModelMetadataSchema = z.object({
  provider: z.string().min(1).default('qwen'),
  model: z.string().min(1).optional(),
  promptVersion: z.string().min(1).optional(),
  toolSchemaVersion: z.string().min(1).optional()
})

export const agentRuntimeContextSchema = z.object({
  tenantId: idSchema,
  userId: idSchema,
  threadId: idSchema,
  runId: idSchema,
  traceId: z.string().min(1).optional(),
  accessToken: z.string().min(1),
  locale: z.string().default('zh-CN'),
  permissions: z.array(z.string()).default([]),
  activePluginIds: z.array(z.string()).default([]),
  modelMetadata: agentModelMetadataSchema.optional(),
  memory: z
    .object({
      includeLongTerm: z.boolean().default(false),
      maxChars: z.number().int().positive().max(20_000).default(6_000)
    })
    .prefault({})
})

export type AgentRuntimeContext = z.infer<typeof agentRuntimeContextSchema>

export const toolResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: z.unknown(), artifactId: z.string().optional() }),
  z.object({
    success: z.literal(false),
    reason: z.string(),
    message: z.string(),
    retryable: z.boolean().default(false)
  })
])

export type ToolResult = z.infer<typeof toolResultSchema>
