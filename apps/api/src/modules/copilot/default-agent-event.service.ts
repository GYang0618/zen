import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../../infra/prisma/index.js'
import { findTokenUsage, omitRawEvent, toJson } from './default-agent-runtime.utils.js'

import type { AuthContext } from '@zen/shared'
import type { RuntimeEvent, RuntimeRunInput } from './default-agent-runtime.types.js'

const RUN_LEASE_MS = 30_000
const HEARTBEAT_THROTTLE_MS = 3_000

@Injectable()
export class DefaultAgentEventService {
  private readonly firstTokenRecorded = new Set<string>()
  private readonly lastHeartbeatRecorded = new Map<string, number>()

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async record(input: RuntimeRunInput, event: RuntimeEvent, auth: AuthContext) {
    if (event.type === 'RAW') {
      await this.recordModelUsage(input.runId, event, auth)
      return null
    }
    const persistedEvent = omitRawEvent(event)
    const isChunkEvent =
      persistedEvent.type === 'TEXT_MESSAGE_CONTENT' ||
      persistedEvent.type === 'REASONING_MESSAGE_CONTENT'
    const now = Date.now()
    const lastHeartbeat = this.lastHeartbeatRecorded.get(input.runId) ?? 0
    const shouldUpdateHeartbeat = !isChunkEvent || now - lastHeartbeat >= HEARTBEAT_THROTTLE_MS

    const sequence = await this.prisma.$transaction(async (tx) => {
      if (
        persistedEvent.type === 'TEXT_MESSAGE_CONTENT' &&
        typeof persistedEvent.delta === 'string' &&
        persistedEvent.delta.length > 0 &&
        !this.firstTokenRecorded.has(input.runId)
      ) {
        this.firstTokenRecorded.add(input.runId)
        if (this.firstTokenRecorded.size > 2000) {
          const firstKey = this.firstTokenRecorded.values().next().value
          if (firstKey) this.firstTokenRecorded.delete(firstKey)
        }
        await tx.agentRun.updateMany({
          where: {
            id: input.runId,
            tenantId: auth.tenantId,
            userId: auth.userId,
            firstTokenAt: null
          },
          data: { firstTokenAt: new Date(now) }
        })
      }

      const updateData: Record<string, unknown> = {
        eventSequence: { increment: 1 }
      }
      if (shouldUpdateHeartbeat) {
        updateData.lastHeartbeatAt = new Date(now)
        updateData.leaseExpiresAt = new Date(now + RUN_LEASE_MS)
        this.lastHeartbeatRecorded.set(input.runId, now)
        if (this.lastHeartbeatRecorded.size > 2000) {
          const firstKey = this.lastHeartbeatRecorded.keys().next().value
          if (firstKey) this.lastHeartbeatRecorded.delete(firstKey)
        }
      }

      const run = await tx.agentRun.update({
        where: { id: input.runId, tenantId: auth.tenantId, userId: auth.userId },
        data: updateData,
        select: { eventSequence: true, threadId: true }
      })
      if (run.threadId !== input.threadId) throw new NotFoundException('Agent run not found')
      await tx.agentEvent.create({
        data: {
          runId: input.runId,
          threadId: input.threadId,
          tenantId: auth.tenantId,
          sequence: run.eventSequence,
          type: persistedEvent.type,
          payload: toJson(persistedEvent)
        }
      })
      return run.eventSequence
    })
    return { event: persistedEvent, sequence }
  }

  async list(runId: string, auth: AuthContext, after = 0, limit = 200) {
    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      select: { id: true }
    })
    if (!run) throw new NotFoundException('Agent run not found')
    const take = Math.min(Math.max(limit, 1), 1_000)
    const items = await this.prisma.agentEvent.findMany({
      where: { runId, tenantId: auth.tenantId, sequence: { gt: Math.max(0, after) } },
      orderBy: { sequence: 'asc' },
      take
    })
    return {
      items,
      cursor: items.at(-1)?.sequence ?? Math.max(0, after),
      hasMore: items.length === take
    }
  }

  private async recordModelUsage(runId: string, event: RuntimeEvent, auth: AuthContext) {
    const raw = asRecord(event.event) ?? asRecord(event.rawEvent)
    if (raw?.event !== 'on_chat_model_end') return
    const usage = findTokenUsage(event)
    await this.prisma.agentRun.updateMany({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      data: {
        inputTokens: { increment: usage.inputTokens },
        outputTokens: { increment: usage.outputTokens },
        modelCalls: { increment: 1 }
      }
    })
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
