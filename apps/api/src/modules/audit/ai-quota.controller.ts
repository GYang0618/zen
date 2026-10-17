import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AiQuotaMetric, AiQuotaPeriod, AiQuotaScope } from '@prisma/client'
import { createAuditDiff, DEFAULT_TENANT_ID, PermissionCode } from '@zen/shared'
import { z } from 'zod'

import { AuditService } from '../../common/auth/audit.service.js'
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js'
import { ACCESS_TOKEN_AUTH, ApiStandardErrorResponses } from '../../common/swagger/index.js'
import { PrismaService } from '../../infra/prisma/index.js'

import type { Request } from 'express'

const saveQuotaSchema = z.object({
  scope: z.enum(['tenant', 'user', 'organization']),
  subjectId: z.string().trim().optional(),
  period: z.enum(['day', 'month']),
  metric: z.enum(['tokens', 'cost']),
  softLimit: z.coerce.number().optional(),
  hardLimit: z.coerce.number().optional(),
  enabled: z.boolean().default(true)
})

const createPriceSchema = z.object({
  provider: z.string().trim().min(1),
  model: z.string().trim().min(1),
  currency: z.string().default('CNY'),
  inputPerMTok: z.coerce.number().int().nonnegative(),
  cachedInputPerMTok: z.coerce.number().int().nonnegative().optional(),
  outputPerMTok: z.coerce.number().int().nonnegative(),
  reasoningPerMTok: z.coerce.number().int().nonnegative().optional(),
  effectiveFrom: z.string().datetime()
})

type SaveQuotaDto = z.infer<typeof saveQuotaSchema>
type CreatePriceDto = z.infer<typeof createPriceSchema>

@ApiTags('AI 配额与模型计价')
@ApiBearerAuth(ACCESS_TOKEN_AUTH)
@Controller()
export class AiQuotaController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  @Get('ai-quotas')
  @RequirePermission(PermissionCode.AI_QUOTA_LIST)
  @ApiOperation({ summary: '查询 AI 配额规则列表' })
  @ApiStandardErrorResponses()
  async listQuotas(@Req() req: Request & { auth?: { tenantId: string } }) {
    const tenantId = req.auth?.tenantId ?? DEFAULT_TENANT_ID
    const list = await this.prisma.aiQuota.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    })
    return list.map((item) => ({
      ...item,
      targetId: item.subjectId || null,
      period: item.period === AiQuotaPeriod.DAY ? 'DAILY' : 'MONTHLY',
      metric: item.metric === AiQuotaMetric.TOKENS ? 'TOTAL_TOKENS' : 'COST_MICROS',
      alertPercent:
        item.hardLimit !== null && item.hardLimit > 0n && item.softLimit !== null
          ? Number((item.softLimit * 100n) / item.hardLimit)
          : 0,
      status: item.enabled ? 'ACTIVE' : 'DISABLED',
      currentUsage: 0,
      usagePercent: 0,
      softLimit: item.softLimit === null ? null : Number(item.softLimit),
      hardLimit: item.hardLimit === null ? null : Number(item.hardLimit)
    }))
  }

  @Put('ai-quotas/:id')
  @RequirePermission(PermissionCode.AI_QUOTA_MANAGE)
  @ApiOperation({ summary: '更新已有 AI 配额' })
  @ApiStandardErrorResponses()
  async updateQuota(
    @Param('id') id: string,
    @Body() payload: { hardLimit?: number; alertPercent?: number; status?: 'ACTIVE' | 'DISABLED' },
    @Req() req: Request & { auth?: { userId: string; tenantId: string } }
  ) {
    const tenantId = req.auth?.tenantId ?? DEFAULT_TENANT_ID
    const existing = await this.prisma.aiQuota.findFirst({ where: { id, tenantId } })
    if (!existing) throw new BadRequestException('AI 配额不存在')
    const hardLimit =
      payload.hardLimit ?? (existing.hardLimit === null ? null : Number(existing.hardLimit))
    const softLimit =
      payload.alertPercent !== undefined && hardLimit !== null
        ? Math.floor((hardLimit * payload.alertPercent) / 100)
        : existing.softLimit === null
          ? null
          : Number(existing.softLimit)
    const updated = await this.prisma.aiQuota.update({
      where: { id },
      data: {
        hardLimit: hardLimit === null ? null : BigInt(hardLimit),
        softLimit: softLimit === null ? null : BigInt(softLimit),
        enabled: payload.status ? payload.status === 'ACTIVE' : undefined,
        updatedBy: req.auth?.userId ?? null
      }
    })
    this.auditService.enqueue({
      action: 'system.ai_quota.updated',
      resource: 'ai_quota',
      resourceId: id,
      actorId: req.auth?.userId,
      diff: createAuditDiff({ summary: '更新了 AI 配额限制与状态' })
    })
    return {
      ...updated,
      targetId: updated.subjectId || null,
      hardLimit: updated.hardLimit === null ? null : Number(updated.hardLimit),
      softLimit: updated.softLimit === null ? null : Number(updated.softLimit),
      alertPercent:
        updated.hardLimit !== null && updated.hardLimit > 0n && updated.softLimit !== null
          ? Number((updated.softLimit * 100n) / updated.hardLimit)
          : 0,
      status: updated.enabled ? 'ACTIVE' : 'DISABLED'
    }
  }

  @Put('ai-quotas')
  @RequirePermission(PermissionCode.AI_QUOTA_MANAGE)
  @ApiOperation({ summary: '设置或更新 AI 配额' })
  @ApiStandardErrorResponses()
  async saveQuota(
    @Body(new ZodValidationPipe(saveQuotaSchema)) payload: SaveQuotaDto,
    @Req() req: Request & { auth?: { userId: string; tenantId: string } }
  ) {
    const scope =
      payload.scope === 'user'
        ? AiQuotaScope.USER
        : payload.scope === 'organization'
          ? AiQuotaScope.ORGANIZATION
          : AiQuotaScope.TENANT
    const period = payload.period === 'day' ? AiQuotaPeriod.DAY : AiQuotaPeriod.MONTH
    const metric = payload.metric === 'cost' ? AiQuotaMetric.COST : AiQuotaMetric.TOKENS
    const subjectId = payload.scope === 'tenant' ? '' : (payload.subjectId ?? '')
    if (payload.scope !== 'tenant' && !subjectId) {
      throw new BadRequestException('用户或组织配额必须指定 subjectId')
    }

    const updated = await this.prisma.aiQuota.upsert({
      where: {
        tenantId_scope_subjectId_period_metric: {
          tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID,
          scope,
          subjectId,
          period,
          metric
        }
      },
      update: {
        softLimit: payload.softLimit !== undefined ? BigInt(payload.softLimit) : null,
        hardLimit: payload.hardLimit !== undefined ? BigInt(payload.hardLimit) : null,
        enabled: payload.enabled,
        updatedBy: req.auth?.userId ?? null
      },
      create: {
        tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID,
        scope,
        subjectId,
        period,
        metric,
        softLimit: payload.softLimit !== undefined ? BigInt(payload.softLimit) : null,
        hardLimit: payload.hardLimit !== undefined ? BigInt(payload.hardLimit) : null,
        enabled: payload.enabled,
        updatedBy: req.auth?.userId ?? null
      }
    })

    this.auditService.enqueue({
      action: 'system.ai_quota.updated',
      resource: 'ai_quota',
      resourceId: updated.id,
      actorId: req.auth?.userId,
      diff: createAuditDiff({
        summary: `更新了 ${payload.scope} 范围的 AI ${payload.metric} 配额`,
        target: { id: updated.id, name: `${payload.scope}:${subjectId || 'tenant'}` },
        changes: [
          {
            field: 'softLimit',
            label: '软上限',
            from: null,
            to: payload.softLimit?.toString() ?? null
          },
          {
            field: 'hardLimit',
            label: '硬上限',
            from: null,
            to: payload.hardLimit?.toString() ?? null
          }
        ]
      })
    })

    return {
      ...updated,
      softLimit: updated.softLimit === null ? null : Number(updated.softLimit),
      hardLimit: updated.hardLimit === null ? null : Number(updated.hardLimit)
    }
  }

  @Get('ai-model-prices')
  @RequirePermission(PermissionCode.AI_QUOTA_LIST)
  @ApiOperation({ summary: '查询模型价格版本' })
  @ApiStandardErrorResponses()
  async listPrices(@Req() req: Request & { auth?: { tenantId: string } }) {
    const list = await this.prisma.aiModelPrice.findMany({
      orderBy: { effectiveFrom: 'desc' }
    })
    return list.map((item) => ({
      ...item,
      tenantId: req.auth?.tenantId ?? DEFAULT_TENANT_ID,
      inputPriceMicros: Number(item.inputPerMTok),
      outputPriceMicros: Number(item.outputPerMTok),
      cachedInputPriceMicros:
        item.cachedInputPerMTok === null ? null : Number(item.cachedInputPerMTok),
      reasoningPriceMicros: item.reasoningPerMTok === null ? null : Number(item.reasoningPerMTok),
      inputPerMTok: Number(item.inputPerMTok),
      cachedInputPerMTok: item.cachedInputPerMTok === null ? null : Number(item.cachedInputPerMTok),
      outputPerMTok: Number(item.outputPerMTok),
      reasoningPerMTok: item.reasoningPerMTok === null ? null : Number(item.reasoningPerMTok)
    }))
  }

  @Post('ai-model-prices')
  @RequirePermission(PermissionCode.AI_PRICE_MANAGE)
  @ApiOperation({ summary: '发布新的模型单价版本' })
  @ApiStandardErrorResponses()
  async createPrice(
    @Body(new ZodValidationPipe(createPriceSchema)) payload: CreatePriceDto,
    @Req() req: Request & { auth?: { userId: string; tenantId: string } }
  ) {
    const created = await this.prisma.aiModelPrice.create({
      data: {
        provider: payload.provider,
        model: payload.model,
        currency: payload.currency,
        inputPerMTok: BigInt(payload.inputPerMTok),
        cachedInputPerMTok:
          payload.cachedInputPerMTok !== undefined ? BigInt(payload.cachedInputPerMTok) : null,
        outputPerMTok: BigInt(payload.outputPerMTok),
        reasoningPerMTok:
          payload.reasoningPerMTok !== undefined ? BigInt(payload.reasoningPerMTok) : null,
        effectiveFrom: new Date(payload.effectiveFrom),
        createdBy: req.auth?.userId ?? null
      }
    })

    this.auditService.enqueue({
      action: 'system.ai_price.created',
      resource: 'ai_model_price',
      resourceId: created.id,
      actorId: req.auth?.userId,
      diff: createAuditDiff({
        summary: `发布了 ${payload.provider}/${payload.model} 的模型价格版本`,
        target: { id: created.id, name: `${payload.provider}/${payload.model}` },
        meta: { effectiveFrom: payload.effectiveFrom, currency: payload.currency }
      })
    })

    return {
      ...created,
      tenantId: DEFAULT_TENANT_ID,
      inputPriceMicros: Number(created.inputPerMTok),
      outputPriceMicros: Number(created.outputPerMTok),
      cachedInputPriceMicros:
        created.cachedInputPerMTok === null ? null : Number(created.cachedInputPerMTok),
      reasoningPriceMicros:
        created.reasoningPerMTok === null ? null : Number(created.reasoningPerMTok),
      inputPerMTok: Number(created.inputPerMTok),
      cachedInputPerMTok:
        created.cachedInputPerMTok === null ? null : Number(created.cachedInputPerMTok),
      outputPerMTok: Number(created.outputPerMTok),
      reasoningPerMTok: created.reasoningPerMTok === null ? null : Number(created.reasoningPerMTok)
    }
  }
}
