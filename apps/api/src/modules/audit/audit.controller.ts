import { Controller, Get, Inject, Query, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { DEFAULT_TENANT_ID, PermissionCode } from '@zen/shared'
import { z } from 'zod'

import { RequirePermission } from '@/common/decorators/require-permission.decorator'
import { buildPaginationMeta, paginate } from '@/common/pagination'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '@/common/swagger'
import { PrismaService } from '@/infra/prisma'

const auditQuerySchema = z.object({
  keyword: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
})

const loginEventQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  success: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined
      if (typeof value === 'boolean') return value
      return value === 'true'
    }),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
})

type AuditQuery = z.infer<typeof auditQuerySchema>
type LoginEventQuery = z.infer<typeof loginEventQuerySchema>

@ApiTags('操作审计')
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
    const where = {
      tenantId: DEFAULT_TENANT_ID,
      ...(query.action ? { action: { contains: query.action } } : {}),
      ...(query.keyword
        ? {
            OR: [
              { action: { contains: query.keyword, mode: 'insensitive' as const } },
              { resource: { contains: query.keyword, mode: 'insensitive' as const } },
              { resourceId: { contains: query.keyword, mode: 'insensitive' as const } }
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

    const actorIds = [
      ...new Set(items.flatMap((item) => (item.actorId ? [item.actorId] : [])))
    ]
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
      actors.map((actor) => [
        actor.id,
        actor.profile?.realName ?? actor.nickname ?? actor.username
      ])
    )

    return {
      items: items.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        actorId: item.actorId,
        actorName: item.actorId ? (actorNames.get(item.actorId) ?? null) : null,
        action: item.action,
        resource: item.resource,
        resourceId: item.resourceId,
        ip: item.ip,
        userAgent: item.userAgent,
        traceId: item.traceId,
        diff: item.diff,
        createdAt: item.createdAt.toISOString()
      })),
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
    const where = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.success === undefined ? {} : { success: query.success })
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
        userId: item.userId,
        identifier: item.identifier,
        success: item.success,
        ip: item.ip,
        userAgent: item.userAgent,
        reason: item.reason,
        createdAt: item.createdAt.toISOString()
      })),
      pagination: pagination ?? buildPaginationMeta(page, pageSize, items.length)
    }
  }
}
