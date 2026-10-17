import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  Req,
  UsePipes
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuditActorType, AuditResult } from '@prisma/client'
import {
  DEFAULT_TENANT_ID,
  describeAgentRun,
  describeAudit,
  formatAuditActor,
  PermissionCode,
  parseAuditDiff,
  resolveRouteTitle
} from '@zen/shared'
import { z } from 'zod'

import { RequirePermission } from '../../common/decorators/require-permission.decorator.js'
import { buildPaginationMeta, paginate } from '../../common/pagination/index.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '../../common/swagger/index.js'
import { PrismaService } from '../../infra/prisma/index.js'

import type { AgentRunStatus, ApiCallerType, Prisma } from '@prisma/client'
import type { Request } from 'express'

const auditQuerySchema = z.object({
  keyword: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  resource: z.string().trim().min(1).optional(),
  resourceId: z.string().trim().min(1).optional(),
  actorId: z.string().trim().min(1).optional(),
  actorType: z.enum(['user', 'agent', 'system']).optional(),
  result: z.enum(['success', 'failure', 'denied', 'SUCCESS', 'FAILURE', 'DENIED']).optional(),
  agentRunId: z.string().trim().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
})

const loginEventQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  identifier: z.string().trim().min(1).optional(),
  success: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined
      if (typeof value === 'boolean') return value
      return value === 'true'
    }),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
})

const accessLogQuerySchema = z.object({
  method: z.string().trim().min(1).optional(),
  userId: z.string().trim().min(1).optional(),
  callerType: z.enum(['user', 'agent', 'api_key', 'anonymous']).optional(),
  route: z.string().trim().min(1).optional(),
  status: z.coerce.number().int().optional(),
  minLatencyMs: z.coerce.number().int().nonnegative().optional(),
  onlyErrors: z.coerce.boolean().optional(),
  traceId: z.string().trim().min(1).optional(),
  agentRunId: z.string().trim().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
})

const statsQuerySchema = z.object({
  days: z.coerce.number().int().positive().default(7)
})

const agentRunsQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
})

type AuditQuery = z.infer<typeof auditQuerySchema>
type LoginEventQuery = z.infer<typeof loginEventQuerySchema>
type AccessLogQuery = z.infer<typeof accessLogQuerySchema>
type StatsQuery = z.infer<typeof statsQuerySchema>
type AgentRunsQuery = z.infer<typeof agentRunsQuerySchema>

@ApiTags('操作与安全审计')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('audit')
export class AuditController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission(PermissionCode.AUDIT_LIST)
  @ApiOperation({ summary: '分页查询操作审计' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(auditQuerySchema, { types: ['query'] }))
  async list(@Query() query: AuditQuery) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const where: Prisma.AuditLogWhereInput = {
      tenantId: DEFAULT_TENANT_ID,
      ...(query.action ? { action: { contains: query.action } } : {}),
      ...(query.resource ? { resource: query.resource } : {}),
      ...(query.resourceId ? { resourceId: query.resourceId } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.actorType
        ? {
            actorType:
              query.actorType === 'agent'
                ? AuditActorType.AGENT
                : query.actorType === 'system'
                  ? AuditActorType.SYSTEM
                  : AuditActorType.USER
          }
        : {}),
      ...(query.result
        ? {
            result:
              query.result.toLowerCase() === 'failure'
                ? AuditResult.FAILURE
                : query.result.toLowerCase() === 'denied'
                  ? AuditResult.DENIED
                  : AuditResult.SUCCESS
          }
        : {}),
      ...(query.agentRunId ? { agentRunId: query.agentRunId } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {})
            }
          }
        : {}),
      ...(query.keyword
        ? {
            OR: [
              { action: { contains: query.keyword, mode: 'insensitive' as const } },
              { resource: { contains: query.keyword, mode: 'insensitive' as const } },
              { resourceId: { contains: query.keyword, mode: 'insensitive' as const } },
              { actorName: { contains: query.keyword, mode: 'insensitive' as const } },
              { traceId: { contains: query.keyword, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const { items, pagination } = await paginate({
      page,
      pageSize,
      count: () => this.prisma.auditLog.count({ where }),
      findMany: ({ skip, take }) =>
        this.prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take
        })
    })

    const actorIds = [...new Set(items.flatMap((item) => (item.actorId ? [item.actorId] : [])))]
    const actors =
      actorIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: {
              id: true,
              username: true,
              nickname: true,
              profile: { select: { realName: true } }
            }
          })
        : []
    const actorNames = new Map(
      actors.map((actor) => [actor.id, actor.profile?.realName ?? actor.nickname ?? actor.username])
    )

    return {
      items: items.map((item) => {
        const rawActorName = item.actorName ?? (item.actorId ? actorNames.get(item.actorId) : null)
        const diff = parseAuditDiff(item.diff)
        const presentation = describeAudit(item.action, diff)
        const actorType = item.actorType.toLowerCase()
        const actorDisplayName = formatAuditActor({
          actorName: rawActorName,
          actorType
        })

        const presentationSections = presentation.sections
        const memberSection = presentationSections?.members
        const filterSection = presentationSections?.filters
        const sections = presentationSections
          ? [
              ...(memberSection
                ? [
                    {
                      title: '成员变更',
                      items: memberSection.names.map((name) => ({
                        label: memberSection.verb,
                        value: name
                      }))
                    }
                  ]
                : []),
              ...(filterSection
                ? [
                    {
                      title: '筛选条件',
                      items: filterSection.map((filter) => ({
                        label: filter.label,
                        value: filter.value
                      }))
                    }
                  ]
                : [])
            ]
          : []

        return {
          id: item.id,
          tenantId: item.tenantId,
          actorId: item.actorId,
          actorType,
          actorName: rawActorName,
          actorDisplay: actorDisplayName,
          action: item.action,
          actionLabel: presentation.title,
          title: presentation.title,
          description: presentation.description,
          sections,
          resource: item.resource,
          resourceId: item.resourceId,
          resourceName: item.resourceName,
          result: item.result,
          errorCode: item.errorCode,
          endpoint: item.endpoint,
          ip: item.ip,
          userAgent: item.userAgent,
          traceId: item.traceId,
          agentRunId: item.agentRunId,
          agentToolName: item.agentToolName,
          agentApprovalId: item.agentApprovalId,
          diff: item.diff,
          createdAt: item.createdAt.toISOString()
        }
      }),
      pagination: pagination ?? buildPaginationMeta(page, pageSize, items.length)
    }
  }

  @Get('login-events')
  @RequirePermission(PermissionCode.AUDIT_LIST)
  @ApiOperation({ summary: '分页查询登录历史' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(loginEventQuerySchema, { types: ['query'] }))
  async listLoginEvents(@Query() query: LoginEventQuery) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where: Prisma.LoginEventWhereInput = {
      tenantId: DEFAULT_TENANT_ID,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.identifier
        ? { identifier: { contains: query.identifier, mode: 'insensitive' as const } }
        : {}),
      ...(query.success === undefined ? {} : { success: query.success }),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {})
            }
          }
        : {})
    }

    const { items, pagination } = await paginate({
      page,
      pageSize,
      count: () => this.prisma.loginEvent.count({ where }),
      findMany: ({ skip, take }) =>
        this.prisma.loginEvent.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take
        })
    })

    return {
      items: items.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        userId: item.userId,
        identifier: item.identifier,
        event: item.event,
        success: item.success,
        ip: item.ip,
        userAgent: item.userAgent,
        reason: item.reason,
        traceId: item.traceId,
        createdAt: item.createdAt.toISOString()
      })),
      pagination: pagination ?? buildPaginationMeta(page, pageSize, items.length)
    }
  }

  @Get('access')
  @RequirePermission(PermissionCode.AUDIT_ACCESS)
  @ApiOperation({ summary: '分页查询接口访问日志' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(accessLogQuerySchema, { types: ['query'] }))
  async listAccessLogs(@Query() query: AccessLogQuery) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const where: Prisma.ApiAccessLogWhereInput = {
      tenantId: DEFAULT_TENANT_ID,
      ...(query.method ? { method: query.method.toUpperCase() } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.callerType ? { callerType: query.callerType.toUpperCase() as ApiCallerType } : {}),
      ...(query.route ? { route: { contains: query.route } } : {}),
      ...(query.status || query.onlyErrors
        ? {
            status: {
              ...(query.status ? { equals: query.status } : {}),
              ...(query.onlyErrors ? { gte: 400 } : {})
            }
          }
        : {}),
      ...(query.minLatencyMs !== undefined ? { latencyMs: { gte: query.minLatencyMs } } : {}),
      ...(query.traceId ? { traceId: query.traceId } : {}),
      ...(query.agentRunId ? { agentRunId: query.agentRunId } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {})
            }
          }
        : {})
    }

    const { items, pagination } = await paginate({
      page,
      pageSize,
      count: () => this.prisma.apiAccessLog.count({ where }),
      findMany: ({ skip, take }) =>
        this.prisma.apiAccessLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take
        })
    })

    return {
      items: items.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        userId: item.userId,
        callerType: item.callerType,
        apiKeyId: item.apiKeyId,
        agentRunId: item.agentRunId,
        agentToolName: item.agentToolName,
        method: item.method,
        route: item.route,
        title: item.title,
        status: item.status,
        latencyMs: item.latencyMs,
        ip: item.ip,
        userAgent: item.userAgent,
        traceId: item.traceId,
        createdAt: item.createdAt.toISOString()
      })),
      pagination: pagination ?? buildPaginationMeta(page, pageSize, items.length)
    }
  }

  @Get('access/stats')
  @RequirePermission(PermissionCode.AUDIT_ACCESS)
  @ApiOperation({ summary: '获取接口访问聚合统计与 Top 路由' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(statsQuerySchema, { types: ['query'] }))
  async getAccessStats(@Query() query: StatsQuery) {
    const days = query.days ?? 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const stats = await this.prisma.apiAccessStat.findMany({
      where: {
        tenantId: DEFAULT_TENANT_ID,
        bucket: { gte: since }
      }
    })

    let totalCalls = 0
    let totalErrors = 0
    let agentCalls = 0
    let weightedLatency = 0

    const topMap = new Map<
      string,
      { method: string; route: string; count: number; errorCount: number; maxP95: number }
    >()

    for (const s of stats) {
      totalCalls += s.count
      totalErrors += s.errorCount
      if (s.callerType === 'AGENT') {
        agentCalls += s.count
      }
      weightedLatency += s.p95Ms * s.count

      const key = `${s.method} ${s.route}`
      const existing = topMap.get(key)
      if (existing) {
        existing.count += s.count
        existing.errorCount += s.errorCount
        existing.maxP95 = Math.max(existing.maxP95, s.p95Ms)
      } else {
        topMap.set(key, {
          method: s.method,
          route: s.route,
          count: s.count,
          errorCount: s.errorCount,
          maxP95: s.p95Ms
        })
      }
    }

    const topRoutes = Array.from(topMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        title: resolveRouteTitle(item.method, item.route),
        avgLatencyMs: item.maxP95,
        errorRate: item.count > 0 ? item.errorCount / item.count : 0
      }))

    return {
      totalCalls,
      errorCount: totalErrors,
      errorRate: totalCalls > 0 ? totalErrors / totalCalls : 0,
      avgLatencyMs: totalCalls > 0 ? Math.round(weightedLatency / totalCalls) : 0,
      p95LatencyMs: totalCalls > 0 ? Math.round(weightedLatency / totalCalls) : 0,
      agentCallCount: agentCalls,
      agentCallRatio: totalCalls > 0 ? agentCalls / totalCalls : 0,
      p95Ms: totalCalls > 0 ? Math.round(weightedLatency / totalCalls) : 0,
      agentPercentage: totalCalls > 0 ? agentCalls / totalCalls : 0,
      topRoutes
    }
  }

  @Get('agent/stats')
  @RequirePermission(PermissionCode.AUDIT_AGENT)
  @ApiOperation({ summary: '获取 Agent Token 用量统计指标' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(statsQuerySchema, { types: ['query'] }))
  async getAgentStats(@Query() query: StatsQuery) {
    const days = query.days ?? 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const daily = await this.prisma.agentUsageDaily.findMany({
      where: {
        tenantId: DEFAULT_TENANT_ID,
        date: { gte: since }
      },
      orderBy: { date: 'asc' }
    })

    let totalTokens = 0n
    let totalCostMicros = 0n
    let totalModelCalls = 0
    let totalToolCalls = 0
    let totalRuns = 0

    const modelDistribution = new Map<
      string,
      { tokens: number; costMicros: number; callCount: number }
    >()
    const dailyMap = new Map<string, { date: string; tokens: number; costMicros: number }>()

    for (const d of daily) {
      totalTokens += d.totalTokens
      totalCostMicros += d.costMicros
      totalModelCalls += d.modelCalls
      totalToolCalls += d.toolCalls
      totalRuns += d.runs

      const modelTokens = Number(d.totalTokens)
      const model = modelDistribution.get(d.model) ?? { tokens: 0, costMicros: 0, callCount: 0 }
      model.tokens += modelTokens
      model.costMicros += Number(d.costMicros)
      model.callCount += d.modelCalls
      modelDistribution.set(d.model, model)

      const dateStr = d.date.toISOString().split('T')[0]!
      const current = dailyMap.get(dateStr) ?? { date: dateStr, tokens: 0, costMicros: 0 }
      current.tokens += modelTokens
      current.costMicros += Number(d.costMicros)
      dailyMap.set(dateStr, current)
    }

    const runs = await this.prisma.agentRun.findMany({
      where: { tenantId: DEFAULT_TENANT_ID, createdAt: { gte: since } },
      select: { userId: true, createdAt: true }
    })
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayUsage = daily.filter((item) => item.date >= todayStart)

    return {
      totalTokens: Number(totalTokens),
      totalCostMicros: Number(totalCostMicros),
      totalModelCalls,
      totalToolCalls,
      totalRuns: runs.length || totalRuns,
      activeUsers: new Set(runs.map((run) => run.userId)).size,
      todayTokens: Number(todayUsage.reduce((sum, item) => sum + item.totalTokens, 0n)),
      todayCostMicros: Number(todayUsage.reduce((sum, item) => sum + item.costMicros, 0n)),
      todayRuns: runs.filter((run) => run.createdAt >= todayStart).length,
      topModels: Array.from(modelDistribution.entries()).map(([model, value]) => ({
        model,
        ...value
      })),
      modelDistribution: Array.from(modelDistribution.entries()).map(([model, tokens]) => ({
        model,
        tokens: tokens.tokens
      })),
      trend: Array.from(dailyMap.values())
    }
  }

  @Get('agent/runs')
  @RequirePermission(PermissionCode.AUDIT_AGENT)
  @ApiOperation({ summary: '分页查询 Agent 执行任务列表' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(agentRunsQuerySchema, { types: ['query'] }))
  async listAgentRuns(@Query() query: AgentRunsQuery) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const where: Prisma.AgentRunWhereInput = {
      tenantId: DEFAULT_TENANT_ID,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.model ? { model: query.model } : {}),
      ...(query.status ? { status: query.status.toLowerCase() as AgentRunStatus } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {})
            }
          }
        : {})
    }

    const { items, pagination } = await paginate({
      page,
      pageSize,
      count: () => this.prisma.agentRun.count({ where }),
      findMany: ({ skip, take }) =>
        this.prisma.agentRun.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take
        })
    })

    return {
      items: items.map((run) => {
        const presentation = describeAgentRun(run)
        return {
          id: run.id,
          tenantId: run.tenantId,
          threadId: run.threadId,
          userId: run.userId,
          userName: run.userName,
          provider: run.provider ?? 'unknown',
          model: run.model ?? 'unknown',
          status: run.status,
          endReason: run.endReason,
          inputTokens: run.inputTokens,
          outputTokens: run.outputTokens,
          reasoningTokens: run.reasoningTokens,
          cachedInputTokens: run.cachedInputTokens,
          totalTokens: run.totalTokens,
          costMicros: Number(run.costMicros),
          stepCount: run.stepCount,
          toolCallCount: run.toolCallCount,
          durationMs: run.durationMs,
          title: presentation.title,
          description: presentation.description,
          createdAt: run.createdAt.toISOString(),
          endedAt: run.endedAt?.toISOString() ?? null
        }
      }),
      pagination: pagination ?? buildPaginationMeta(page, pageSize, items.length)
    }
  }

  @Get('agent/runs/:runId')
  @RequirePermission(PermissionCode.AUDIT_AGENT)
  @ApiOperation({ summary: '获取单次 Agent 运行的完整下钻详情' })
  @ApiStandardErrorResponses()
  async getAgentRunDetail(
    @Param('runId') runId: string,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    const run = await this.prisma.agentRun.findUnique({
      where: { id: runId, tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID },
      include: {
        calls: { orderBy: { callIndex: 'asc' } },
        toolExecutions: { orderBy: { createdAt: 'asc' } },
        approvals: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (!run) throw new NotFoundException('Agent 运行记录不存在')

    // 关联通过 agentRunId 触发的业务审计日志
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { tenantId: run.tenantId, agentRunId: runId },
      orderBy: { createdAt: 'asc' }
    })

    const presentation = describeAgentRun(run)

    return {
      ...run,
      costMicros: Number(run.costMicros),
      title: presentation.title,
      description: presentation.description,
      calls: run.calls.map((c) => ({
        ...c,
        stepIndex: c.callIndex,
        durationMs: c.latencyMs,
        costMicros: Number(c.costMicros)
      })),
      auditLogs: auditLogs.map((log) => {
        const diff = parseAuditDiff(log.diff)
        const p = describeAudit(log.action, diff)
        return {
          id: log.id,
          tenantId: log.tenantId,
          actorType: log.actorType.toLowerCase(),
          actorId: log.actorId,
          actorName: log.actorName,
          actorDisplay: formatAuditActor({
            actorName: log.actorName,
            actorType: log.actorType.toLowerCase()
          }),
          action: log.action,
          actionLabel: p.title,
          title: p.title,
          description: p.description,
          result: log.result,
          createdAt: log.createdAt.toISOString()
        }
      })
    }
  }
}
