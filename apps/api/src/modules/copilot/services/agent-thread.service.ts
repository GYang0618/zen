import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DEFAULT_AGENT_GRAPH_ID } from '@zen/shared'

import { PrismaService } from '@/infra/prisma'

import {
  clamp,
  decodeThreadCursor,
  encodeThreadCursor,
  normalizeRuntimeMessages,
  toJson
} from '../default-agent-runtime.utils'

import type { Prisma } from '@prisma/client'
import type { AuthContext } from '@zen/shared'
import type { NormalizedMessage } from '../default-agent-runtime.utils'

@Injectable()
export class AgentThreadService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listThreads(auth: AuthContext, query: { limit?: number; cursor?: string } = {}) {
    const pageSize = clamp(query.limit ?? 30, 1, 100)
    const cursor = query.cursor ? decodeThreadCursor(query.cursor) : undefined
    if (query.cursor && !cursor) {
      throw new BadRequestException('Invalid thread cursor')
    }

    const records = await this.prisma.agentThread.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        agentId: DEFAULT_AGENT_GRAPH_ID,
        ...(cursor
          ? {
              OR: [
                { updatedAt: { lt: cursor.updatedAt } },
                { updatedAt: cursor.updatedAt, id: { lt: cursor.id } }
              ]
            }
          : {})
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: pageSize + 1,
      select: {
        id: true,
        title: true,
        status: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true, runs: true } }
      }
    })

    const hasMore = records.length > pageSize
    const items = hasMore ? records.slice(0, pageSize) : records
    const last = items.at(-1)

    return {
      items,
      cursor: last ? encodeThreadCursor(last) : null,
      hasMore
    }
  }

  async getThread(threadId: string, auth: AuthContext) {
    const thread = await this.prisma.agentThread.findFirst({
      where: { id: threadId, tenantId: auth.tenantId, userId: auth.userId },
      include: {
        messages: { orderBy: { sequence: 'asc' } },
        runs: { orderBy: { createdAt: 'desc' }, take: 20 },
        checkpoints: { orderBy: { version: 'desc' }, take: 1 }
      }
    })
    if (!thread) throw new NotFoundException('Agent thread not found')
    return thread
  }

  async updateThread(
    threadId: string,
    input: { title?: string; status?: 'active' | 'archived' },
    auth: AuthContext
  ) {
    await this.requireThread(threadId, auth)
    const title = input.title?.trim()
    if (title !== undefined && (title.length === 0 || title.length > 120)) {
      throw new BadRequestException('Thread title must be between 1 and 120 characters')
    }
    return this.prisma.agentThread.update({
      where: { id: threadId },
      data: { ...(title ? { title } : {}), ...(input.status ? { status: input.status } : {}) }
    })
  }

  async deleteThread(threadId: string, auth: AuthContext): Promise<void> {
    const result = await this.prisma.agentThread.deleteMany({
      where: { id: threadId, tenantId: auth.tenantId, userId: auth.userId }
    })
    if (!result.count) throw new NotFoundException('Agent thread not found')
  }

  async requireThread(threadId: string, auth: AuthContext) {
    const thread = await this.prisma.agentThread.findFirst({
      where: { id: threadId, tenantId: auth.tenantId, userId: auth.userId }
    })
    if (!thread) throw new NotFoundException('Agent thread not found')
    return thread
  }

  async persistMessages(
    tx: Prisma.TransactionClient,
    threadId: string,
    turnId: string,
    tenantId: string,
    messages: NormalizedMessage[]
  ) {
    for (const [index, message] of messages.entries()) {
      await tx.agentMessage.upsert({
        where: { id: message.id },
        create: {
          id: message.id,
          threadId,
          turnId,
          tenantId,
          sequence: index,
          role: message.role,
          content: message.content,
          toolCallId: message.toolCallId,
          metadata: message.metadata ? toJson(message.metadata) : undefined
        },
        update: {
          content: message.content,
          toolCallId: message.toolCallId,
          metadata: message.metadata ? toJson(message.metadata) : undefined
        }
      })
    }
  }

  async saveCheckpoint(threadId: string, runId: string, state: unknown, auth: AuthContext) {
    const normalizedMessages = normalizeRuntimeMessages(
      (state as { messages?: unknown[] })?.messages
    )
    const sanitizedState = {
      ...(state as Record<string, unknown>),
      messages: normalizedMessages
    }

    const latest = await this.prisma.agentCheckpoint.findFirst({
      where: { threadId, tenantId: auth.tenantId },
      orderBy: { version: 'desc' },
      select: { version: true }
    })
    const version = (latest?.version ?? 0) + 1

    return this.prisma.agentCheckpoint.create({
      data: {
        threadId,
        runId,
        tenantId: auth.tenantId,
        version,
        state: toJson(sanitizedState)
      }
    })
  }
}
