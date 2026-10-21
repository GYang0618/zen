import { request } from '@/lib/request'

import type { PaginationResponse } from '@/lib/request'

export interface AuditPresentationSection {
  title: string
  items: Array<{
    label: string
    value: string
    hint?: string
  }>
}

export interface AuditActorDetail {
  id: string
  username: string
  nickname: string | null
  realName: string | null
  email: string | null
  phoneNumber: string | null
  avatar: string | null
  deletedAt?: string | null
}

export interface AuditLogItem {
  id: string
  tenantId: string
  actorType: 'user' | 'agent' | 'system' | 'anonymous'
  actorId: string | null
  actorName: string | null
  actorDisplay: string
  actor?: AuditActorDetail | null
  action: string
  actionLabel: string
  resource: string | null
  resourceId: string | null
  resourceName: string | null
  result: 'SUCCESS' | 'FAILURE' | 'DENIED'
  errorCode: string | null
  endpoint: string | null
  ip: string | null
  userAgent: string | null
  traceId: string | null
  agentRunId: string | null
  agentToolName: string | null
  agentApprovalId: string | null
  title: string
  description: string
  sections: AuditPresentationSection[]
  diff: unknown
  createdAt: string
}

export interface LoginEventItem {
  id: string
  tenantId: string
  userId: string | null
  user?: AuditActorDetail | null
  identifier: string
  event: string
  success: boolean
  ip: string | null
  userAgent: string | null
  traceId: string | null
  reason: string | null
  createdAt: string
}

export interface ApiAccessLogItem {
  id: string
  tenantId: string
  userId: string | null
  user?: AuditActorDetail | null
  callerType: string
  apiKeyId: string | null
  agentRunId: string | null
  agentToolName: string | null
  method: string
  route: string
  title: string
  status: number
  latencyMs: number
  ip: string | null
  userAgent: string | null
  traceId: string
  createdAt: string
}

export interface ApiAccessStatsSummary {
  totalCalls: number
  errorCount: number
  errorRate: number
  avgLatencyMs: number
  p95LatencyMs: number
  agentCallCount: number
  agentCallRatio: number
  topRoutes: Array<{
    route: string
    method: string
    title: string
    count: number
    errorCount: number
    avgLatencyMs: number
  }>
}

export interface AgentUsageStatsSummary {
  totalTokens: number
  totalCostMicros: number
  totalRuns: number
  activeUsers: number
  todayTokens: number
  todayCostMicros: number
  todayRuns: number
  topModels: Array<{
    model: string
    tokens: number
    costMicros: number
    callCount: number
  }>
}

export interface AgentRunItem {
  id: string
  tenantId: string
  threadId?: string | null
  userId: string
  userName: string | null
  user?: AuditActorDetail | null
  title: string | null
  provider: string | null
  model: string | null
  status: string
  totalTokens: number
  usageReported?: boolean
  costMicros: number
  durationMs: number | null
  stepCount: number
  createdAt: string
  endedAt: string | null
}

export interface AgentModelCallItem {
  id: string
  stepIndex: number
  purpose: string
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cachedInputTokens: number
  costMicros: number
  durationMs: number | null
  status: string
  createdAt: string
}

export interface AgentRunDetail extends AgentRunItem {
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cachedInputTokens: number
  calls: AgentModelCallItem[]
  auditLogs: AuditLogItem[]
}

export interface AiQuotaItem {
  id: string
  tenantId: string
  scope: 'TENANT' | 'ORGANIZATION' | 'USER'
  targetId: string | null
  period: 'DAILY' | 'MONTHLY' | 'TOTAL'
  metric: 'TOTAL_TOKENS' | 'COST_MICROS'
  hardLimit: number
  alertPercent: number
  status: 'ACTIVE' | 'DISABLED'
  currentUsage: number
  usagePercent: number
  createdAt: string
  updatedAt: string
}

export interface AiModelPriceItem {
  id: string
  tenantId: string
  provider: string
  model: string
  inputPriceMicros: number
  outputPriceMicros: number
  cachedInputPriceMicros: number | null
  reasoningPriceMicros: number | null
  effectiveFrom: string
  effectiveTo: string | null
  createdAt: string
}

export interface AuditQuery {
  keyword?: string
  action?: string
  resource?: string
  resourceId?: string
  agentRunId?: string
  actorType?: 'user' | 'agent' | 'system' | 'anonymous'
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED'
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface LoginEventQuery {
  userId?: string
  identifier?: string
  success?: boolean
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface ApiAccessLogQuery {
  method?: string
  route?: string
  callerType?: string
  userId?: string
  agentRunId?: string
  status?: number
  statuses?: number[]
  statusCategory?: 'normal' | 'error'
  minLatencyMs?: number
  maxLatencyMs?: number
  onlyErrors?: boolean
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface ApiAccessStatsQuery {
  route?: string
  callerType?: string
  from?: string
  to?: string
}

export interface AgentStatsQuery {
  from?: string
  to?: string
}

export interface AgentRunQuery {
  userId?: string
  model?: string
  status?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface UpdateAiQuotaDto {
  hardLimit?: number
  alertPercent?: number
  status?: 'ACTIVE' | 'DISABLED'
}

export interface CreateAiModelPriceDto {
  provider: string
  model: string
  inputPriceMicros: number
  outputPriceMicros: number
  cachedInputPriceMicros?: number | null
  reasoningPriceMicros?: number | null
  effectiveFrom?: string
}

export const auditApi = {
  // 操作审计
  list: (params?: AuditQuery) =>
    request.get<PaginationResponse<AuditLogItem>>('/audit', { params }),

  // 登录事件
  listLoginEvents: (params?: LoginEventQuery) =>
    request.get<PaginationResponse<LoginEventItem>>('/audit/login-events', { params }),

  // API 访问日志与统计
  listAccessLogs: (params?: ApiAccessLogQuery) =>
    request.get<PaginationResponse<ApiAccessLogItem>>('/audit/access', { params }),

  getAccessStats: (params?: ApiAccessStatsQuery) =>
    request.get<ApiAccessStatsSummary>('/audit/access/stats', { params }),

  // Agent 执行流水与用量账本
  getAgentStats: (params?: AgentStatsQuery) =>
    request.get<AgentUsageStatsSummary>('/audit/agent/stats', { params }),

  listAgentRuns: (params?: AgentRunQuery) =>
    request.get<PaginationResponse<AgentRunItem>>('/audit/agent/runs', { params }),

  getAgentRunDetail: (runId: string) => request.get<AgentRunDetail>(`/audit/agent/runs/${runId}`),

  // 配额与定价
  listAiQuotas: () => request.get<AiQuotaItem[]>('/ai-quotas'),

  updateAiQuota: (id: string, data: UpdateAiQuotaDto) =>
    request.put<AiQuotaItem>(`/ai-quotas/${id}`, data),

  listAiModelPrices: () => request.get<AiModelPriceItem[]>('/ai-model-prices'),

  createAiModelPrice: (data: CreateAiModelPriceDto) =>
    request.post<AiModelPriceItem>('/ai-model-prices', {
      provider: data.provider,
      model: data.model,
      inputPerMTok: data.inputPriceMicros,
      outputPerMTok: data.outputPriceMicros,
      cachedInputPerMTok: data.cachedInputPriceMicros ?? undefined,
      reasoningPerMTok: data.reasoningPriceMicros ?? undefined,
      effectiveFrom: data.effectiveFrom ?? new Date().toISOString()
    })
}
