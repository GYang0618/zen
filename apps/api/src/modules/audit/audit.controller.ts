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
import { AgentCallPurpose, AgentCallStatus, AuditActorType, AuditResult } from '@prisma/client'
import {
  agentModelCallsToolQuerySchema,
  auditStatsQuerySchema,
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
import { StorageService } from '../storage/storage.service.js'
import { AuditStatsService } from './audit-stats.service.js'

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
  statuses: z
    .union([z.string(), z.array(z.coerce.number().int())])
    .optional()
    .transform((val) => {
      if (!val) return undefined
      if (Array.isArray(val)) return val
      return val
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n))
    }),
  statusCategory: z.enum(['normal', 'error']).optional(),
  minLatencyMs: z.coerce.number().int().nonnegative().optional(),
  maxLatencyMs: z.coerce.number().int().nonnegative().optional(),
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
type AuditStatsQuery = z.infer<typeof auditStatsQuerySchema>
type AgentRunsQuery = z.infer<typeof agentRunsQuerySchema>
type AgentModelCallsQuery = z.infer<typeof agentModelCallsToolQuerySchema>

@ApiTags('操作与安全审计')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller('audit')
export class AuditController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditStatsService) private readonly statsService: AuditStatsService,
    @Inject(StorageService) private readonly storageService: StorageService
  ) {}

  private async enrichUsersWithAvatar<
    T extends {
      id: string
      username: string
      nickname: string | null
      email: string
      phoneNumber: string | null
      profile: { realName: string | null; avatar: string | null } | null
    }
  >(users: T[]) {
    return Promise.all(
      users.map(async (u) => ({
        id: u.id,
        username: u.username,
        nickname: u.nickname,
        realName: u.profile?.realName ?? null,
        email: u.email,
        phoneNumber: u.phoneNumber,
        avatar: await this.storageService.resolveAvatarUrl(u.profile?.avatar)
      }))
    )
  }

  @Get()
  @RequirePermission(PermissionCode.AUDIT_LIST)
  @ApiOperation({ summary: '分页查询操作审计' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(auditQuerySchema, { types: ['query'] }))
  async list(
    @Query() query: AuditQuery,
    @Req() req: Request & { auth?: { tenantId: string; permissions: string[]; isAdmin?: boolean } }
  ) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const where: Prisma.AuditLogWhereInput = {
      tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID,
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
              email: true,
              phoneNumber: true,
              profile: { select: { realName: true, avatar: true } }
            }
          })
        : []
    const resolvedActors = await this.enrichUsersWithAvatar(actors)
    const actorMap = new Map(resolvedActors.map((actor) => [actor.id, actor]))

    return {
      items: items.map((item) => {
        const actorDetail = item.actorId ? (actorMap.get(item.actorId) ?? null) : null
        const rawActorName =
          item.actorName ??
          (actorDetail
            ? (actorDetail.realName ?? actorDetail.nickname ?? actorDetail.username)
            : null)
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
          actor: actorDetail,
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
          diff:
            req.auth?.isAdmin || req.auth?.permissions?.includes(PermissionCode.AUDIT_DETAIL)
              ? item.diff
              : undefined,
          createdAt: item.createdAt.toISOString()
        }
      }),
      pagination: pagination ?? buildPaginationMeta(page, pageSize, items.length)
    }
  }

  @Get('stats/overview')
  @RequirePermission({
    codes: [
      PermissionCode.AUDIT_LIST,
      PermissionCode.AUDIT_LOGIN,
      PermissionCode.AUDIT_ACCESS,
      PermissionCode.AUDIT_AGENT
    ],
    mode: 'all'
  })
  @ApiOperation({ summary: '获取统一审计概览统计' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(auditStatsQuerySchema, { types: ['query'] }))
  getOverviewStats(
    @Query() query: AuditStatsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    return this.statsService.overview(req.auth?.tenantId ?? DEFAULT_TENANT_ID, query)
  }

  @Get('stats/operations')
  @RequirePermission(PermissionCode.AUDIT_LIST)
  @ApiOperation({ summary: '按操作、资源、结果和操作者统计审计日志' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(auditStatsQuerySchema, { types: ['query'] }))
  getOperationStats(
    @Query() query: AuditStatsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    return this.statsService.operations(req.auth?.tenantId ?? DEFAULT_TENANT_ID, query)
  }

  @Get('stats/logins')
  @RequirePermission(PermissionCode.AUDIT_LOGIN)
  @ApiOperation({ summary: '获取登录事件成功率与事件类型分布' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(auditStatsQuerySchema, { types: ['query'] }))
  getLoginStats(
    @Query() query: AuditStatsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    return this.statsService.logins(req.auth?.tenantId ?? DEFAULT_TENANT_ID, query)
  }

  @Get('stats/security')
  @RequirePermission({
    codes: [PermissionCode.AUDIT_LIST, PermissionCode.AUDIT_LOGIN],
    mode: 'all'
  })
  @ApiOperation({ summary: '获取拒绝访问、失败操作、限流和登录失败统计' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(auditStatsQuerySchema, { types: ['query'] }))
  getSecurityStats(
    @Query() query: AuditStatsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    return this.statsService.security(req.auth?.tenantId ?? DEFAULT_TENANT_ID, query)
  }

  @Get('stats/access')
  @RequirePermission(PermissionCode.AUDIT_ACCESS)
  @ApiOperation({ summary: '获取接口调用量、错误率、调用方和 Top 路由统计' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(auditStatsQuerySchema, { types: ['query'] }))
  getAccessStatistics(
    @Query() query: AuditStatsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    return this.statsService.access(req.auth?.tenantId ?? DEFAULT_TENANT_ID, query)
  }

  @Get('stats/agent')
  @RequirePermission(PermissionCode.AUDIT_AGENT)
  @ApiOperation({ summary: '获取 Agent 运行、模型用量、Token 和成本统计' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(auditStatsQuerySchema, { types: ['query'] }))
  getAgentStatistics(
    @Query() query: AuditStatsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    return this.statsService.agent(req.auth?.tenantId ?? DEFAULT_TENANT_ID, query)
  }

  @Get('login-events')
  @RequirePermission(PermissionCode.AUDIT_LOGIN)
  @ApiOperation({ summary: '分页查询登录历史' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(loginEventQuerySchema, { types: ['query'] }))
  async listLoginEvents(
    @Query() query: LoginEventQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where: Prisma.LoginEventWhereInput = {
      tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID,
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

    const userIds = [...new Set(items.flatMap((item) => (item.userId ? [item.userId] : [])))]
    const identifiers = [...new Set(items.map((item) => item.identifier))]
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          ...(userIds.length > 0 ? [{ id: { in: userIds } }] : []),
          ...(identifiers.length > 0
            ? [{ username: { in: identifiers } }, { email: { in: identifiers } }]
            : [])
        ]
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        phoneNumber: true,
        profile: { select: { realName: true, avatar: true } }
      }
    })

    const resolvedUsers = await this.enrichUsersWithAvatar(users)
    const userMapById = new Map(resolvedUsers.map((u) => [u.id, u]))
    const userMapByIdentifier = new Map(
      resolvedUsers.flatMap((u) => [
        [u.username.toLowerCase(), u],
        [u.email.toLowerCase(), u]
      ])
    )

    return {
      items: items.map((item) => {
        const user =
          (item.userId ? userMapById.get(item.userId) : null) ??
          userMapByIdentifier.get(item.identifier.toLowerCase()) ??
          null

        return {
          id: item.id,
          tenantId: item.tenantId,
          userId: item.userId,
          user,
          identifier: item.identifier,
          event: item.event,
          success: item.success,
          ip: item.ip,
          userAgent: item.userAgent,
          reason: item.reason,
          traceId: item.traceId,
          createdAt: item.createdAt.toISOString()
        }
      }),
      pagination: pagination ?? buildPaginationMeta(page, pageSize, items.length)
    }
  }

  @Get('access')
  @RequirePermission(PermissionCode.AUDIT_ACCESS)
  @ApiOperation({ summary: '分页查询接口访问日志' })
  @ApiOkResponse({ description: '查询成功' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(accessLogQuerySchema, { types: ['query'] }))
  async listAccessLogs(
    @Query() query: AccessLogQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const where: Prisma.ApiAccessLogWhereInput = {
      tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID,
      ...(query.method ? { method: query.method.toUpperCase() } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.callerType ? { callerType: query.callerType.toUpperCase() as ApiCallerType } : {}),
      ...(query.route ? { route: { contains: query.route } } : {}),
      ...(query.statusCategory === 'normal'
        ? { status: { lt: 400 } }
        : query.statusCategory === 'error' || query.onlyErrors
          ? { status: { gte: 400 } }
          : query.statuses && query.statuses.length > 0
            ? { status: { in: query.statuses } }
            : query.status
              ? { status: { equals: query.status } }
              : {}),
      ...(query.minLatencyMs !== undefined || query.maxLatencyMs !== undefined
        ? {
            latencyMs: {
              ...(query.minLatencyMs !== undefined ? { gte: query.minLatencyMs } : {}),
              ...(query.maxLatencyMs !== undefined ? { lte: query.maxLatencyMs } : {})
            }
          }
        : {}),
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

    const userIds = [...new Set(items.flatMap((item) => (item.userId ? [item.userId] : [])))]
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              username: true,
              nickname: true,
              email: true,
              phoneNumber: true,
              profile: { select: { realName: true, avatar: true } }
            }
          })
        : []
    const resolvedUsers = await this.enrichUsersWithAvatar(users)
    const userMap = new Map(resolvedUsers.map((u) => [u.id, u]))

    return {
      items: items.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        userId: item.userId,
        user: item.userId ? (userMap.get(item.userId) ?? null) : null,
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
  async getAccessStats(
    @Query() query: StatsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    const days = query.days ?? 7
    const stats = await this.statsService.access(req.auth?.tenantId ?? DEFAULT_TENANT_ID, {
      days,
      top: 10
    })
    const agentCalls = stats.byCaller.find((item) => item.callerType === 'AGENT')?.count ?? 0

    return {
      totalCalls: stats.requestCount,
      errorCount: stats.errorCount,
      errorRate: stats.errorRate,
      avgLatencyMs: stats.meanMs,
      p95LatencyMs: stats.p95EstimateMs,
      latencyCoverageCount: stats.coverageCount,
      latencyCoverageRatio: stats.coverageRatio,
      p95Bucket: stats.p95Bucket,
      p95IsLowerBound: stats.p95IsLowerBound,
      p95IsHistogramEstimate: true,
      agentCallCount: agentCalls,
      agentCallRatio: stats.requestCount ? agentCalls / stats.requestCount : 0,
      p95Ms: stats.p95EstimateMs,
      agentPercentage: stats.requestCount ? agentCalls / stats.requestCount : 0,
      topRoutes: stats.topRoutes.map((item) => ({
        ...item,
        title: resolveRouteTitle(item.method, item.route),
        avgLatencyMs: item.meanMs,
        p95LatencyMs: item.p95EstimateMs,
        errorRate: item.count ? item.errorCount / item.count : 0
      }))
    }
  }

  @Get('agent/stats')
  @RequirePermission(PermissionCode.AUDIT_AGENT)
  @ApiOperation({ summary: '获取 Agent Token 用量统计指标' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(statsQuerySchema, { types: ['query'] }))
  async getAgentStats(
    @Query() query: StatsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    const days = query.days ?? 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const daily = await this.prisma.agentUsageDaily.findMany({
      where: {
        tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID,
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
      where: { tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID, createdAt: { gte: since } },
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
  async listAgentRuns(
    @Query() query: AgentRunsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const where: Prisma.AgentRunWhereInput = {
      tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID,
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

    const userIds = [...new Set(items.flatMap((run) => (run.userId ? [run.userId] : [])))]
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              username: true,
              nickname: true,
              email: true,
              phoneNumber: true,
              profile: { select: { realName: true, avatar: true } }
            }
          })
        : []
    const resolvedUsers = await this.enrichUsersWithAvatar(users)
    const userMap = new Map(resolvedUsers.map((u) => [u.id, u]))

    return {
      items: items.map((run) => {
        const presentation = describeAgentRun(run)
        return {
          id: run.id,
          tenantId: run.tenantId,
          threadId: run.threadId,
          userId: run.userId,
          userName: run.userName,
          user: run.userId ? (userMap.get(run.userId) ?? null) : null,
          provider: run.provider,
          model: run.model,
          status: run.status,
          endReason: run.endReason,
          inputTokens: run.inputTokens,
          outputTokens: run.outputTokens,
          reasoningTokens: run.reasoningTokens,
          cachedInputTokens: run.cachedInputTokens,
          totalTokens: run.totalTokens,
          usageReported: run.modelCalls > 0 || run.totalTokens > 0,
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

  @Get('agent/model-calls')
  @RequirePermission(PermissionCode.AUDIT_AGENT)
  @ApiOperation({ summary: '分页查询 Agent 模型调用与 Token 用量明细' })
  @ApiStandardErrorResponses()
  @UsePipes(new ZodValidationPipe(agentModelCallsToolQuerySchema, { types: ['query'] }))
  async listAgentModelCalls(
    @Query() query: AgentModelCallsQuery,
    @Req() req: Request & { auth?: { tenantId: string } }
  ) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where: Prisma.AgentModelCallWhereInput = {
      tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.runId ? { runId: query.runId } : {}),
      ...(query.model ? { model: query.model } : {}),
      ...(query.purpose
        ? {
            purpose: AgentCallPurpose[query.purpose.toUpperCase() as keyof typeof AgentCallPurpose]
          }
        : {}),
      ...(query.status
        ? { status: AgentCallStatus[query.status.toUpperCase() as keyof typeof AgentCallStatus] }
        : {}),
      ...(query.estimated !== undefined ? { estimated: query.estimated === 'true' } : {}),
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
      count: () => this.prisma.agentModelCall.count({ where }),
      findMany: ({ skip, take }) =>
        this.prisma.agentModelCall.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take
        })
    })

    return {
      items: items.map((call) => ({ ...call, costMicros: Number(call.costMicros) })),
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

    const user = run.userId
      ? await this.prisma.user.findUnique({
          where: { id: run.userId },
          select: {
            id: true,
            username: true,
            nickname: true,
            email: true,
            phoneNumber: true,
            profile: { select: { realName: true, avatar: true } }
          }
        })
      : null
    const resolvedUser = user ? ((await this.enrichUsersWithAvatar([user]))[0] ?? null) : null

    return {
      ...run,
      user: resolvedUser,
      provider: run.provider,
      model: run.model,
      usageReported: run.modelCalls > 0 || run.totalTokens > 0,
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
