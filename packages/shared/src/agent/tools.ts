import { z } from 'zod'

import { permissionCodeSchema } from '../primitives/index.js'
import { agentRuntimeContextSchema } from './contracts.js'

export const toolRiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical'])
export const toolSideEffectSchema = z.enum(['none', 'write', 'destructive'])
export const toolNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_-]*$/)
  .max(128)
export const toolJsonSchema = z.object({ type: z.literal('object') }).catchall(z.json())

export const toolExecutionPolicySchema = z.object({
  permissionCode: permissionCodeSchema.optional(),
  riskLevel: toolRiskLevelSchema,
  sideEffect: toolSideEffectSchema,
  requiresApproval: z.boolean(),
  timeoutMs: z.number().int().positive().max(300_000),
  retryPolicy: z.object({
    maxRetries: z.number().int().min(0).max(5),
    retryableReasons: z.array(z.string().min(1)).readonly()
  }),
  idempotencyPolicy: z.enum(['none', 'run-tool-call']),
  pluginId: z.string().min(1).optional()
})

export const toolManifestSchema = toolExecutionPolicySchema
  .extend({
    name: toolNameSchema,
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    description: z.string().min(1),
    inputSchema: toolJsonSchema,
    capabilities: z.array(z.string().min(1)).min(1),
    ui: z.object({
      label: z.string().min(1),
      icon: z.string().min(1).optional(),
      component: z.string().min(1).optional()
    })
  })
  .superRefine((tool, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message })
    if (tool.sideEffect !== 'none') {
      if (!tool.permissionCode) issue('permissionCode', 'Mutating tools must declare a permission')
      if (tool.idempotencyPolicy === 'none')
        issue('idempotencyPolicy', 'Mutating tools require idempotency')
    }
    if (
      (tool.sideEffect === 'destructive' || ['high', 'critical'].includes(tool.riskLevel)) &&
      !tool.requiresApproval
    ) {
      issue('requiresApproval', 'High-risk tools require approval')
    }
    if (tool.sideEffect !== 'none' && tool.retryPolicy.maxRetries > 0) {
      issue('retryPolicy', 'Mutating tools must not retry automatically')
    }
  })

export const toolExecutionContextSchema = agentRuntimeContextSchema.extend({
  toolName: toolNameSchema,
  toolCallId: z.string().min(1),
  approvalId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1).optional(),
  abortSignal: z.instanceof(AbortSignal).optional()
})

export type ToolManifest = z.infer<typeof toolManifestSchema>
export type ToolExecutionPolicy = z.infer<typeof toolExecutionPolicySchema>
export type ToolRiskLevel = z.infer<typeof toolRiskLevelSchema>
export type ToolSideEffect = z.infer<typeof toolSideEffectSchema>
export type ToolExecutionContext = z.infer<typeof toolExecutionContextSchema>
