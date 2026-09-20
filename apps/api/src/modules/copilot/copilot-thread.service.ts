import { randomUUID } from 'node:crypto'

import { Inject, Injectable, Logger } from '@nestjs/common'
import { AgentThreadStatus } from '@prisma/client'
import { deriveProvisionalThreadTitle } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/prisma.service.js'

import type { Prisma } from '@prisma/client'

export interface ThreadSummary {
  id: string
  name: string | null
  archived: boolean
  agentId: string
  createdAt: string
  updatedAt: string
  lastRunAt?: string
}

export interface ThreadMessage {
  id: string
  role: string
  content?: string
  toolCalls?: Array<{
    id: string
    name: string
    args: string
  }>
  toolCallId?: string
}

export interface SaveThreadSnapshotParams {
  threadId: string
  tenantId: string
  userId: string
  agentId: string
  messages: Array<{
    id: string
    role: string
    content?: string
    toolCalls?: Array<{ id: string; name: string; args: string }>
    toolCallId?: string
  }>
}

@Injectable()
export class CopilotThreadService {
  private readonly logger = new Logger(CopilotThreadService.name)

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async ensureThread(params: {
    threadId: string
    tenantId: string
    userId: string
    agentId?: string
    title?: string
  }): Promise<ThreadSummary> {
    const now = new Date()
    const agentId = params.agentId ?? 'default'
    await this.prisma.agentThread.upsert({
      where: { id: params.threadId },
      create: {
        id: params.threadId,
        tenantId: params.tenantId,
        userId: params.userId,
        agentId,
        status: AgentThreadStatus.active,
        lastMessageAt: now,
        ...(params.title ? { title: params.title } : {})
      },
      update: {
        updatedAt: now
      }
    })

    if (params.title) {
      await this.prisma.agentThread.updateMany({
        where: {
          id: params.threadId,
          tenantId: params.tenantId,
          userId: params.userId,
          OR: [{ title: null }, { title: '' }]
        },
        data: { title: params.title }
      })
    }

    const row = await this.prisma.agentThread.findFirstOrThrow({
      where: {
        id: params.threadId,
        tenantId: params.tenantId,
        userId: params.userId
      }
    })

    return {
      id: row.id,
      name: row.title,
      archived: row.status === AgentThreadStatus.archived,
      agentId: row.agentId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lastRunAt: row.lastMessageAt?.toISOString() ?? row.updatedAt.toISOString()
    }
  }

  async listThreads(params: {
    tenantId: string
    userId: string
    agentId?: string
    includeArchived?: boolean
    limit?: number
    cursor?: string
  }): Promise<{ threads: ThreadSummary[]; nextCursor: string | null }> {
    const limit = Math.min(params.limit && params.limit > 0 ? params.limit : 50, 100)
    const where: Prisma.AgentThreadWhereInput = {
      tenantId: params.tenantId,
      userId: params.userId,
      ...(params.agentId ? { agentId: params.agentId } : {}),
      ...(params.includeArchived ? {} : { status: AgentThreadStatus.active })
    }

    const items = await this.prisma.agentThread.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {})
    })

    let nextCursor: string | null = null
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem?.id ?? null
    }

    const threads: ThreadSummary[] = items.map((t) => ({
      id: t.id,
      name: t.title,
      archived: t.status === AgentThreadStatus.archived,
      agentId: t.agentId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      lastRunAt: t.lastMessageAt?.toISOString() ?? t.updatedAt.toISOString()
    }))

    return { threads, nextCursor }
  }

  async getThread(params: {
    threadId: string
    tenantId?: string
    userId?: string
  }): Promise<ThreadSummary | null> {
    const thread = await this.prisma.agentThread.findFirst({
      where: {
        id: params.threadId,
        ...(params.tenantId ? { tenantId: params.tenantId } : {}),
        ...(params.userId ? { userId: params.userId } : {})
      }
    })

    if (!thread) return null

    return {
      id: thread.id,
      name: thread.title,
      archived: thread.status === AgentThreadStatus.archived,
      agentId: thread.agentId,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      lastRunAt: thread.lastMessageAt?.toISOString() ?? thread.updatedAt.toISOString()
    }
  }

  async updateThread(params: {
    threadId: string
    tenantId: string
    userId: string
    name?: string
  }): Promise<ThreadSummary> {
    const updated = await this.prisma.agentThread.update({
      where: {
        id: params.threadId,
        tenantId: params.tenantId,
        userId: params.userId
      },
      data: {
        ...(params.name !== undefined ? { title: params.name } : {})
      }
    })

    return {
      id: updated.id,
      name: updated.title,
      archived: updated.status === AgentThreadStatus.archived,
      agentId: updated.agentId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      lastRunAt: updated.lastMessageAt?.toISOString() ?? updated.updatedAt.toISOString()
    }
  }

  async archiveThread(params: {
    threadId: string
    tenantId: string
    userId: string
  }): Promise<{ threadId: string; archived: boolean }> {
    await this.prisma.agentThread.update({
      where: {
        id: params.threadId,
        tenantId: params.tenantId,
        userId: params.userId
      },
      data: {
        status: AgentThreadStatus.archived
      }
    })

    return { threadId: params.threadId, archived: true }
  }

  async deleteThread(params: {
    threadId: string
    tenantId: string
    userId: string
  }): Promise<{ threadId: string; deleted: boolean }> {
    await this.prisma.agentThread.deleteMany({
      where: {
        id: params.threadId,
        tenantId: params.tenantId,
        userId: params.userId
      }
    })

    return { threadId: params.threadId, deleted: true }
  }

  async getThreadMessages(params: {
    threadId: string
    tenantId?: string
    userId?: string
  }): Promise<{ messages: ThreadMessage[] }> {
    const messages = await this.prisma.agentMessage.findMany({
      where: {
        threadId: params.threadId,
        ...(params.tenantId ? { tenantId: params.tenantId } : {})
      },
      orderBy: { sequence: 'asc' }
    })

    return {
      messages: messages.map((m) => {
        const meta = m.metadata as { toolCalls?: ThreadMessage['toolCalls'] } | null
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          toolCalls: meta?.toolCalls,
          toolCallId: m.toolCallId ?? undefined
        }
      })
    }
  }

  private deriveProvisionalTitle(
    messages: SaveThreadSnapshotParams['messages']
  ): string | undefined {
    const firstUserMessage = messages
      .find(
        (m) => m.role === 'user' && typeof m.content === 'string' && m.content.trim().length > 0
      )
      ?.content?.trim()

    if (!firstUserMessage) return undefined
    return deriveProvisionalThreadTitle(firstUserMessage)
  }

  async saveThreadSnapshot(params: SaveThreadSnapshotParams): Promise<void> {
    const now = new Date()
    const provisionalTitle = this.deriveProvisionalTitle(params.messages)
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.agentThread.upsert({
          where: { id: params.threadId },
          create: {
            id: params.threadId,
            tenantId: params.tenantId,
            userId: params.userId,
            agentId: params.agentId,
            status: AgentThreadStatus.active,
            lastMessageAt: now,
            ...(provisionalTitle ? { title: provisionalTitle } : {})
          },
          update: {
            lastMessageAt: now,
            updatedAt: now
          }
        })

        // 旧会话若尚无标题，回填临时标题；已有标题（手动重命名 / LLM）不覆盖
        if (provisionalTitle) {
          await tx.agentThread.updateMany({
            where: {
              id: params.threadId,
              OR: [{ title: null }, { title: '' }]
            },
            data: { title: provisionalTitle }
          })
        }

        for (let sequence = 0; sequence < params.messages.length; sequence++) {
          const msg = params.messages[sequence]!
          await tx.agentMessage.upsert({
            where: {
              threadId_sequence: {
                threadId: params.threadId,
                sequence
              }
            },
            create: {
              id: msg.id || randomUUID(),
              threadId: params.threadId,
              tenantId: params.tenantId,
              sequence,
              role: msg.role,
              content: msg.content ?? '',
              toolCallId: msg.toolCallId ?? null,
              metadata:
                msg.toolCalls && msg.toolCalls.length > 0 ? { toolCalls: msg.toolCalls } : undefined
            },
            update: {
              role: msg.role,
              content: msg.content ?? '',
              toolCallId: msg.toolCallId ?? null,
              metadata:
                msg.toolCalls && msg.toolCalls.length > 0
                  ? { toolCalls: msg.toolCalls }
                  : undefined,
              updatedAt: now
            }
          })
        }
      })
    } catch (error) {
      this.logger.error({ err: error, threadId: params.threadId }, '保存 AgentThread 会话快照失败')
    }
  }
}
