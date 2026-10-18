import { z } from 'zod'

export const auditDateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export const auditStatsQuerySchema = auditDateRangeSchema.extend({
  days: z.coerce.number().int().min(1).max(90).default(7),
  top: z.coerce.number().int().min(1).max(20).default(10)
})

export const auditLogsToolQuerySchema = z.object({
  keyword: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  resource: z.string().trim().min(1).optional(),
  resourceId: z.string().trim().min(1).optional(),
  actorId: z.string().trim().min(1).optional(),
  actorType: z.enum(['user', 'agent', 'system']).optional(),
  result: z.enum(['success', 'failure', 'denied']).optional(),
  agentRunId: z.string().trim().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
})

export const loginEventsToolQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  identifier: z.string().trim().min(1).optional(),
  success: z.enum(['true', 'false']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
})

export const accessLogsToolQuerySchema = z.object({
  method: z.string().trim().min(1).optional(),
  userId: z.string().trim().min(1).optional(),
  callerType: z.enum(['user', 'agent', 'api_key', 'anonymous']).optional(),
  route: z.string().trim().min(1).optional(),
  status: z.coerce.number().int().min(100).max(599).optional(),
  onlyErrors: z.coerce.boolean().optional(),
  minLatencyMs: z.coerce.number().int().nonnegative().optional(),
  traceId: z.string().trim().min(1).optional(),
  agentRunId: z.string().trim().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
})

export const agentRunsToolQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  status: z.enum(['pending', 'running', 'succeeded', 'failed', 'cancelled']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
})

export const agentModelCallsToolQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  runId: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  purpose: z.enum(['chat', 'summarization', 'title', 'fallback']).optional(),
  status: z.enum(['succeeded', 'failed', 'aborted']).optional(),
  estimated: z.enum(['true', 'false']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
})
