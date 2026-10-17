import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Inject,
  Param,
  Post,
  Req,
  UnauthorizedException
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AgentApprovalDecision, AgentApprovalStatus } from '@prisma/client'
import { createAuditDiff } from '@zen/shared'

import { AuditService } from '../../common/auth/audit.service.js'
import { Public } from '../../common/decorators/public.decorator.js'
import { PrismaService } from '../../infra/prisma/index.js'
import { CopilotUsageService } from './copilot-usage.service.js'

import type { Request } from 'express'
import type { UsageReportItem } from './copilot-usage.service.js'

type ApprovalDecisionDto = {
  approved: boolean
  comment?: string
}

@ApiTags('Agent 运行时内部与审批')
@Controller('copilot/runtime')
export class CopilotRuntimeController {
  constructor(
    @Inject(CopilotUsageService) private readonly usageService: CopilotUsageService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  @Public()
  @Post('usage')
  @ApiOperation({ summary: '批量上报 Agent 模型用量（内部通信）' })
  async reportUsage(
    @Headers('authorization') authHeader: string | undefined,
    @Headers('x-agent-internal-token') internalToken: string | undefined,
    @Body() body: { items: UsageReportItem[] }
  ) {
    const configuredToken = process.env.AGENT_INTERNAL_TOKEN
    if (configuredToken) {
      if (internalToken !== configuredToken && authHeader !== `Bearer ${configuredToken}`) {
        throw new UnauthorizedException('无效的内部服务通信凭证')
      }
    }

    if (!body?.items || !Array.isArray(body.items)) {
      throw new BadRequestException('请求体必须包含 items 数组')
    }

    return this.usageService.recordUsage(body.items)
  }

  @Post('approvals/:id/decision')
  @ApiOperation({ summary: '裁决 Agent 人工审批单' })
  async decideApproval(
    @Param('id') id: string,
    @Body() payload: ApprovalDecisionDto,
    @Req() req: Request & { auth?: { userId: string; tenantId: string } }
  ) {
    const tenantId = req.auth?.tenantId
    const userId = req.auth?.userId
    if (!tenantId || !userId) throw new UnauthorizedException()

    const approval = await this.prisma.agentApproval.findFirst({
      where: { id, tenantId, userId }
    })
    if (!approval) {
      throw new BadRequestException('审批单不存在')
    }

    const nextStatus = payload.approved
      ? AgentApprovalStatus.approved
      : AgentApprovalStatus.rejected
    const now = new Date()
    const updatedCount = await this.prisma.agentApproval.updateMany({
      where: { id, tenantId, userId, status: AgentApprovalStatus.pending },
      data: {
        status: nextStatus,
        decision: payload.approved ? AgentApprovalDecision.approve : AgentApprovalDecision.reject,
        reason: payload.comment ?? null,
        decidedBy: userId,
        decidedAt: now
      }
    })
    if (updatedCount.count === 0) throw new BadRequestException('审批单已完成裁决')
    const updated = await this.prisma.agentApproval.findUniqueOrThrow({ where: { id } })

    const action = payload.approved ? 'agent.approval.approved' : 'agent.approval.rejected'
    this.auditService.enqueue({
      actorId: req.auth?.userId,
      tenantId: req.auth?.tenantId,
      action,
      resource: 'agent_approval',
      resourceId: id,
      agentRunId: approval.runId,
      diff: createAuditDiff({
        summary: `${payload.approved ? '批准' : '拒绝'}了 AI 助手操作（工具：${approval.toolName}）`,
        meta: { toolName: approval.toolName, comment: payload.comment }
      })
    })

    return updated
  }
}
