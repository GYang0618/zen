import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DEFAULT_AGENT_GRAPH_ID } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'
import { clamp } from './default-agent-runtime.utils.js'

import type { AgentRunStatus } from '@prisma/client'
import type { AuthContext } from '@zen/shared'

@Injectable()
export class DefaultAgentRunService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list(auth: AuthContext, query: { threadId?: string; status?: string; limit?: number }) {
    return this.prisma.agentRun.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        agentId: DEFAULT_AGENT_GRAPH_ID,
        ...(query.threadId ? { threadId: query.threadId } : {}),
        ...(query.status ? { status: query.status as AgentRunStatus } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: clamp(query.limit ?? 30, 1, 100),
      include: {
        _count: { select: { events: true, toolExecutions: true, approvals: true, artifacts: true } }
      }
    })
  }

  async get(runId: string, auth: AuthContext) {
    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      include: {
        turns: { orderBy: { sequence: 'asc' } },
        toolExecutions: { orderBy: { createdAt: 'asc' } },
        approvals: { orderBy: { createdAt: 'asc' } },
        artifacts: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            runId: true,
            threadId: true,
            toolExecutionId: true,
            kind: true,
            name: true,
            mimeType: true,
            size: true,
            summary: true,
            status: true,
            createdAt: true
          }
        }
      }
    })
    if (!run) throw new NotFoundException('Agent run not found')
    return run
  }

  async require(runId: string, auth: AuthContext) {
    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      select: { id: true, threadId: true, status: true, eventSequence: true }
    })
    if (!run) throw new NotFoundException('Agent run not found')
    return run
  }

  async prepareResume(runId: string, reason: string | undefined, auth: AuthContext) {
    const run = await this.require(runId, auth)
    if (!['failed', 'cancelled', 'timed_out', 'interrupted'].includes(run.status)) {
      throw new BadRequestException('Only stopped runs can be resumed')
    }
    const thread = await this.prisma.agentThread.findFirst({
      where: { id: run.threadId, tenantId: auth.tenantId, userId: auth.userId },
      include: {
        messages: { orderBy: { sequence: 'asc' } },
        checkpoints: { orderBy: { version: 'desc' }, take: 1 }
      }
    })
    if (!thread) throw new NotFoundException('Agent thread not found')
    await this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        resumeCount: { increment: 1 },
        error: reason ? { resumeReason: reason } : undefined
      }
    })
    return {
      sourceRunId: runId,
      threadId: run.threadId,
      messages: thread.messages,
      checkpoint: thread.checkpoints[0] ?? null,
      eventCursor: run.eventSequence
    }
  }
}
