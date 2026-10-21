import { z } from 'zod'

export const AUDIT_STATS_DAYS_MIN = 1
export const AUDIT_STATS_DAYS_MAX = 90
export const AUDIT_STATS_DAYS_DEFAULT = 7
export const AUDIT_STATS_TOP_MIN = 1
export const AUDIT_STATS_TOP_MAX = 20
export const AUDIT_STATS_TOP_DEFAULT = 10

export const auditDateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export const auditStatsQuerySchema = auditDateRangeSchema.extend({
  days: z.coerce
    .number()
    .int()
    .min(AUDIT_STATS_DAYS_MIN)
    .max(AUDIT_STATS_DAYS_MAX)
    .default(AUDIT_STATS_DAYS_DEFAULT)
    .describe(
      `统计天数，范围 ${AUDIT_STATS_DAYS_MIN}-${AUDIT_STATS_DAYS_MAX}，默认 ${AUDIT_STATS_DAYS_DEFAULT}`
    ),
  top: z.coerce
    .number()
    .int()
    .min(AUDIT_STATS_TOP_MIN)
    .max(AUDIT_STATS_TOP_MAX)
    .default(AUDIT_STATS_TOP_DEFAULT)
    .describe(
      `排行条数，范围 ${AUDIT_STATS_TOP_MIN}-${AUDIT_STATS_TOP_MAX}，默认 ${AUDIT_STATS_TOP_DEFAULT}`
    )
})

function clampBoundedInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

/**
 * Agent 工具入参。schema 必须能转成 JSON Schema，因此不能使用 preprocess / transform。
 * days / top 的越界截断在 {@link normalizeAuditStatsQuery} 中完成。
 * HTTP 查询仍使用 auditStatsQuerySchema，越界返回 400。
 */
export const auditStatsToolQuerySchema = auditDateRangeSchema.extend({
  days: z
    .number()
    .default(AUDIT_STATS_DAYS_DEFAULT)
    .describe(
      `统计天数，范围 ${AUDIT_STATS_DAYS_MIN}-${AUDIT_STATS_DAYS_MAX}，默认 ${AUDIT_STATS_DAYS_DEFAULT}。超出范围按边界截断`
    ),
  top: z
    .number()
    .default(AUDIT_STATS_TOP_DEFAULT)
    .describe(
      `排行条数，范围 ${AUDIT_STATS_TOP_MIN}-${AUDIT_STATS_TOP_MAX}，默认 ${AUDIT_STATS_TOP_DEFAULT}。超出范围按边界截断`
    )
})

export function normalizeAuditStatsQuery<T extends { days?: number; top?: number }>(query: T) {
  return {
    ...query,
    days: clampBoundedInt(
      query.days ?? AUDIT_STATS_DAYS_DEFAULT,
      AUDIT_STATS_DAYS_MIN,
      AUDIT_STATS_DAYS_MAX
    ),
    top: clampBoundedInt(
      query.top ?? AUDIT_STATS_TOP_DEFAULT,
      AUDIT_STATS_TOP_MIN,
      AUDIT_STATS_TOP_MAX
    )
  }
}

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

export const loginStatsTrendItemSchema = z.object({
  bucketStart: z.string().describe('分桶开始时间（ISO字符串）'),
  total: z.number().int().nonnegative().describe('登录尝试总次数'),
  successCount: z.number().int().nonnegative().describe('成功登录次数'),
  failureCount: z.number().int().nonnegative().describe('失败登录次数')
})

export type LoginStatsTrendItem = z.infer<typeof loginStatsTrendItemSchema>

export const agentUsageTrendItemSchema = z.object({
  date: z.string().describe('统计日期 YYYY-MM-DD'),
  runs: z.number().int().nonnegative().describe('Agent 执行次数'),
  modelCalls: z.number().int().nonnegative().describe('LLM 模型调用次数'),
  toolCalls: z.number().int().nonnegative().describe('工具调用总次数'),
  totalTokens: z.number().int().nonnegative().describe('总消耗 Token 数'),
  costMicros: z.number().int().nonnegative().describe('消耗成本（微元）')
})

export type AgentUsageTrendItem = z.infer<typeof agentUsageTrendItemSchema>
