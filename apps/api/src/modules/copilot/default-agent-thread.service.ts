import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DEFAULT_AGENT_GRAPH_ID } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'
import { clamp, decodeThreadCursor, encodeThreadCursor } from './default-agent-runtime.utils.js'

import type { AuthContext } from '@zen/shared'

@Injectable()
export class DefaultAgentThreadService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(auth: AuthContext, query: { limit?: number; cursor?: string } = {}) {
    const pageSize = clamp(query.limit ?? 30, 1, 100)
    const cursor = query.cursor ? decodeThreadCursor(query.cursor) : undefined
    if (query.cursor && !cursor) throw new BadRequestException('Invalid thread cursor')
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
    return { items, cursor: last ? encodeThreadCursor(last) : null, hasMore }
  }

  async get(threadId: string, auth: AuthContext) {
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

  async update(
    threadId: string,
    input: { title?: string; status?: 'active' | 'archived' },
    auth: AuthContext
  ) {
    await this.require(threadId, auth)
    const title = input.title?.trim()
    if (title !== undefined && (title.length === 0 || title.length > 120)) {
      throw new BadRequestException('Thread title must be between 1 and 120 characters')
    }
    return this.prisma.agentThread.update({
      where: { id: threadId },
      data: { ...(title ? { title } : {}), ...(input.status ? { status: input.status } : {}) }
    })
  }

  async delete(threadId: string, auth: AuthContext): Promise<void> {
    const result = await this.prisma.agentThread.deleteMany({
      where: { id: threadId, tenantId: auth.tenantId, userId: auth.userId }
    })
    if (!result.count) throw new NotFoundException('Agent thread not found')
  }

  async require(threadId: string, auth: AuthContext) {
    const thread = await this.prisma.agentThread.findFirst({
      where: { id: threadId, tenantId: auth.tenantId, userId: auth.userId },
      select: { id: true }
    })
    if (!thread) throw new NotFoundException('Agent thread not found')
    return thread
  }
}
