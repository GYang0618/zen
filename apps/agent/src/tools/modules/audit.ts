import {
  accessLogsToolQuerySchema,
  agentModelCallsToolQuerySchema,
  agentRunsToolQuerySchema,
  auditLogsToolQuerySchema,
  auditStatsQuerySchema,
  loginEventsToolQuerySchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import { executeApiCall } from '@/api/call-api'
import { client } from '@/api/client'

import type { RunnableConfig } from '@langchain/core/runnables'

const runIdSchema = z.object({ runId: z.string().trim().min(1) })

function queryApi(path: string, query: object, config: RunnableConfig | undefined) {
  return executeApiCall(config, () => client.get({ url: path, query } as never))
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
  async (query, config) => queryApi('/api/audit/stats/overview', query, config),
  {
    name: 'query_audit_overview_stats',
    description: '获取指定时间范围的操作审计、登录、API 访问和 Agent 用量概览。默认最近 7 天。',
    schema: auditStatsQuerySchema
  }
)

export const queryOperationAuditStatsTool = tool(
  async (query, config) => queryApi('/api/audit/stats/operations', query, config),
  {
    name: 'query_operation_audit_stats',
    description: '统计操作审计总数、拒绝与失败数，并按 action、资源和操作者类型排行。',
    schema: auditStatsQuerySchema
  }
)

export const queryLoginAuditStatsTool = tool(
  async (query, config) => queryApi('/api/audit/stats/logins', query, config),
  {
    name: 'query_login_audit_stats',
    description: '统计登录事件总数、成功率、失败数和认证事件类型分布。',
    schema: auditStatsQuerySchema
  }
)

export const querySecurityAuditStatsTool = tool(
  async (query, config) => queryApi('/api/audit/stats/security', query, config),
  {
    name: 'query_security_audit_stats',
    description: '统计越权拒绝、业务失败、限流和登录失败，并列出高频事件及来源 IP。',
    schema: auditStatsQuerySchema
  }
)

export const queryAccessAuditStatsTool = tool(
  async (query, config) => queryApi('/api/audit/stats/access', query, config),
  {
    name: 'query_api_access_stats',
    description:
      '统计 API 总调用量、错误率、调用方类型、Top 路由及按时间分桶的 trend。trend 每项包含 bucketStart、requestCount、errorCount、errorRate 和延迟覆盖指标；查询范围不超过 2 天时按小时分桶，否则按天分桶，可用于真实趋势图。延迟均值只基于已采集直方图的请求，p95 是区间估值。响应会给出覆盖率和 p95 区间，落入 >=5000ms 开放区间时只表示下界。',
    schema: auditStatsQuerySchema
  }
)

export const queryAgentUsageStatsTool = tool(
  async (query, config) => queryApi('/api/audit/stats/agent', query, config),
  {
    name: 'query_agent_usage_stats',
    description: '统计 Agent Run、模型调用、工具调用、输入输出 Token、成本及模型分布。',
    schema: auditStatsQuerySchema
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
