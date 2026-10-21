import {
  AUDIT_STATS_DAYS_DEFAULT,
  AUDIT_STATS_DAYS_MAX,
  AUDIT_STATS_DAYS_MIN,
  AUDIT_STATS_TOP_DEFAULT,
  AUDIT_STATS_TOP_MAX,
  AUDIT_STATS_TOP_MIN,
  accessLogsToolQuerySchema,
  agentModelCallsToolQuerySchema,
  agentRunsToolQuerySchema,
  auditLogsToolQuerySchema,
  auditStatsToolQuerySchema,
  loginEventsToolQuerySchema,
  normalizeAuditStatsQuery
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import { executeApiCall } from '@/api/call-api'
import { client } from '@/api/client'

import type { RunnableConfig } from '@langchain/core/runnables'

const runIdSchema = z.object({ runId: z.string().trim().min(1) })

const auditStatsRangeHint =
  `days 取值 ${AUDIT_STATS_DAYS_MIN}-${AUDIT_STATS_DAYS_MAX}（默认 ${AUDIT_STATS_DAYS_DEFAULT}），` +
  `top 取值 ${AUDIT_STATS_TOP_MIN}-${AUDIT_STATS_TOP_MAX}（默认 ${AUDIT_STATS_TOP_DEFAULT}）。` +
  '超出范围会按边界截断。'

function queryApi(path: string, query: object, config: RunnableConfig | undefined) {
  return executeApiCall(config, () => client.get({ url: path, query } as never))
}

function queryStats(
  path: string,
  query: Parameters<typeof normalizeAuditStatsQuery>[0],
  config: RunnableConfig | undefined
) {
  return queryApi(path, normalizeAuditStatsQuery(query), config)
}

export const queryAuditLogsTool = tool(
  async (query, config) => queryApi('/api/audit', query, config),
  {
    name: 'query_audit_logs',
    description:
      '按关键字、操作、资源、操作者、结果、Agent Run 或时间范围分页查询操作审计记录。默认每页 20 条，最多 100 条；查历史记录时必须使用筛选和分页。',
    schema: auditLogsToolQuerySchema
  }
)

export const queryLoginEventsTool = tool(
  async (query, config) => queryApi('/api/audit/login-events', query, config),
  {
    name: 'query_login_events',
    description:
      '分页查询登录、登出、刷新令牌和 MFA 等认证事件，可按用户、账号标识、成功状态和时间筛选。',
    schema: loginEventsToolQuerySchema
  }
)

export const queryApiAccessLogsTool = tool(
  async (query, config) => queryApi('/api/audit/access', query, config),
  {
    name: 'query_api_access_logs',
    description:
      '分页查询 API 接口访问记录，可按调用者、Agent Run、路由、状态码、慢请求和 traceId 筛选。普通 GET 访问按策略采样，写请求、错误、Agent 请求和慢请求全量记录。',
    schema: accessLogsToolQuerySchema
  }
)

export const queryAgentRunsTool = tool(
  async (query, config) => queryApi('/api/audit/agent/runs', query, config),
  {
    name: 'query_agent_runs',
    description: '分页查询 Agent Run，可按用户、模型、状态和时间范围筛选。',
    schema: agentRunsToolQuerySchema
  }
)

export const queryAgentModelCallsTool = tool(
  async (query, config) => queryApi('/api/audit/agent/model-calls', query, config),
  {
    name: 'query_agent_model_calls',
    description:
      '分页查询所有 Agent 模型调用用量，包括不属于 Run 的标题生成调用，可按模型、用途、状态、估算标记和时间范围筛选。',
    schema: agentModelCallsToolQuerySchema
  }
)

export const queryAgentRunDetailTool = tool(
  async ({ runId }, config) =>
    executeApiCall(config, () =>
      client.get({ url: `/api/audit/agent/runs/${encodeURIComponent(runId)}` })
    ),
  {
    name: 'query_agent_run_detail',
    description:
      '查询单个 Agent Run 的模型调用、工具执行、审批、业务审计事件与用量详情。需要 Agent Run ID。',
    schema: runIdSchema
  }
)

export const queryAuditOverviewStatsTool = tool(
  async (query, config) => queryStats('/api/audit/stats/overview', query, config),
  {
    name: 'query_audit_overview_stats',
    description:
      '获取指定时间范围的操作审计、登录、API 访问和 Agent 用量概览。默认最近 7 天。comparison 是上一周期环比，配合 StatCard。sparklines.dates 与 operations、logins、requests、agentRuns 等长且已补零，直接作为 SparklineCard 数据，禁止截断或补造。' +
      auditStatsRangeHint,
    schema: auditStatsToolQuerySchema
  }
)

export const queryOperationAuditStatsTool = tool(
  async (query, config) => queryStats('/api/audit/stats/operations', query, config),
  {
    name: 'query_operation_audit_stats',
    description:
      '统计操作审计总数、拒绝与失败数。trend 按日给出 successCount、failureCount、deniedCount，可做堆叠柱。series.actionRanking、resourceRanking 做横向条形图，resultDistribution、actorDistribution 做环形图。' +
      auditStatsRangeHint,
    schema: auditStatsToolQuerySchema
  }
)

export const queryLoginAuditStatsTool = tool(
  async (query, config) => queryStats('/api/audit/stats/logins', query, config),
  {
    name: 'query_login_audit_stats',
    description:
      '统计登录总数、successRate（0-1）、事件分布和 trend。绘制热力或活动日历时把 days 设为 84。heatmap 原样给 HeatmapCard，calendar 原样给 ActivityCalendar.days。series.outcomeDistribution 与 eventDistribution 给环形图。' +
      auditStatsRangeHint,
    schema: auditStatsToolQuerySchema
  }
)

export const querySecurityAuditStatsTool = tool(
  async (query, config) => queryStats('/api/audit/stats/security', query, config),
  {
    name: 'query_security_audit_stats',
    description:
      '统计越权拒绝、业务失败、限流和登录失败。trend 按日给出 denied、failed、failedLogins，可做多折线。series.actionRanking 与 byIp 做横向条形图。' +
      auditStatsRangeHint,
    schema: auditStatsToolQuerySchema
  }
)

export const queryAccessAuditStatsTool = tool(
  async (query, config) => queryStats('/api/audit/stats/access', query, config),
  {
    name: 'query_api_access_stats',
    description:
      '统计 API 调用量、errorRate（0-1）、调用方、Top 路由和 trend。series.latencyDistribution 是延迟分桶，series.callerDistribution 与 outcomeDistribution 是构成。trend 在不超过 2 天时按小时，否则按天。延迟均值只覆盖已采集直方图的请求，p95 是区间估值。' +
      auditStatsRangeHint,
    schema: auditStatsToolQuerySchema
  }
)

export const queryAgentUsageStatsTool = tool(
  async (query, config) => queryStats('/api/audit/stats/agent', query, config),
  {
    name: 'query_agent_usage_stats',
    description:
      '统计 Agent Run、模型调用、工具调用、Token、成本和模型分布。trend 按日补零，含 inputTokens、outputTokens、totalTokens、costMicros。successRate 为 0-1。quotas 只含已启用的租户级配额，为空时不要画配额仪表；usageRate 为已用/硬上限。series.statusDistribution 与 purposeDistribution 是构成。' +
      auditStatsRangeHint,
    schema: auditStatsToolQuerySchema
  }
)

export const auditTools = [
  queryAuditLogsTool,
  queryLoginEventsTool,
  queryApiAccessLogsTool,
  queryAgentRunsTool,
  queryAgentModelCallsTool,
  queryAgentRunDetailTool,
  queryAuditOverviewStatsTool,
  queryOperationAuditStatsTool,
  queryLoginAuditStatsTool,
  querySecurityAuditStatsTool,
  queryAccessAuditStatsTool,
  queryAgentUsageStatsTool
] as const
