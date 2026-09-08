import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '../../infra/prisma/index.js'
import { asRecord, parseJson, toJson } from './default-agent-runtime.utils.js'

import type { AuthContext } from '@zen/shared'
import type { RuntimeEvent, RuntimeRunInput } from './default-agent-runtime.types.js'

@Injectable()
export class DefaultAgentToolLedgerService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async start(input: RuntimeRunInput, event: RuntimeEvent, auth: AuthContext) {
    const toolCallId = String(event.toolCallId ?? event.id ?? '')
    const toolName = String(event.toolCallName ?? event.name ?? 'unknown_tool')
    if (!toolCallId) return
    await this.prisma.agentToolExecution.upsert({
      where: { runId_toolCallId: { runId: input.runId, toolCallId } },
      create: {
        runId: input.runId,
        tenantId: auth.tenantId,
        toolCallId,
        toolName,
        idempotencyKey: `${input.runId}:${toolCallId}`,
        status: 'running',
        startedAt: new Date()
      },
      update: { status: 'running', startedAt: new Date() }
    })
  }

  async updateArguments(input: RuntimeRunInput, event: RuntimeEvent, auth: AuthContext) {
    const toolCallId = String(event.toolCallId ?? '')
    if (!toolCallId) return
    const args = await this.collectToolArgs(input.runId, toolCallId, auth)
    await this.prisma.agentToolExecution.updateMany({
      where: { runId: input.runId, toolCallId, tenantId: auth.tenantId },
      data: { arguments: toJson(parseJson(args)) }
    })
  }

  async finish(input: RuntimeRunInput, event: RuntimeEvent, auth: AuthContext) {
    const toolCallId = String(event.toolCallId ?? '')
    if (!toolCallId) return
    const result = parseJson(event.content ?? event.result)
    const failed = asRecord(result)?.success === false
    await this.prisma.$transaction([
      this.prisma.agentToolExecution.updateMany({
        where: { runId: input.runId, toolCallId, tenantId: auth.tenantId },
        data: {
          result: toJson(result),
          status: failed ? 'failed' : 'succeeded',
          errorReason: failed ? String(asRecord(result)?.reason ?? 'tool_error') : null,
          endedAt: new Date()
        }
      }),
      this.prisma.agentRun.updateMany({
        where: { id: input.runId, tenantId: auth.tenantId, userId: auth.userId },
        data: failed ? { failureCount: { increment: 1 } } : {}
      })
    ])
  }

  private async collectToolArgs(runId: string, toolCallId: string, auth: AuthContext) {
    const events = await this.prisma.agentEvent.findMany({
      where: { runId, tenantId: auth.tenantId, type: 'TOOL_CALL_ARGS' },
      orderBy: { sequence: 'asc' },
      select: { payload: true }
    })
    return events
      .map(({ payload }) =>
        asRecord(payload)?.toolCallId === toolCallId ? String(asRecord(payload)?.delta ?? '') : ''
      )
      .join('')
  }
}
