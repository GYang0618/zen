import { randomUUID } from 'node:crypto'

import { Inject, Injectable, Logger } from '@nestjs/common'
import { AgentThreadStatus } from '@prisma/client'
import {
  DEFAULT_AGENT_ID,
  deriveProvisionalThreadTitle,
  LEGACY_DEFAULT_THREAD_AGENT_ID
} from '@zen/shared'

import { PrismaService } from '../../infra/prisma/prisma.service.js'
import { mergeAuthoritativeSnapshot } from './thread-history-replay.js'
import { restoreDisplacedTurnPrefix } from './thread-message-order.js'

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
    type: 'function'
    name: string
    args: string
    function: {
      name: string
      arguments: string
    }
  }>
  toolCallId?: string
}

export interface SaveThreadSnapshotParams {
  threadId: string
  tenantId: string
  userId: string
  agentId: string
  messages: ThreadMessage[]
  /**
   * replace：快照覆盖整段会话；若快照缺少已有用户轮次，则与已保存消息合并。
   * append：流被中断、还没有快照时，只补上新消息。
   */
  mode?: 'replace' | 'append'
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
      ...(params.agentId ? { agentId: { in: threadAgentIds(params.agentId) } } : {}),
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
      messages: restoreDisplacedTurnPrefix(messages.map((message) => this.toThreadMessage(message)))
    }
  }

  private toThreadMessage(row: {
    id: string
    role: string
    content: string
    toolCallId: string | null
    metadata: unknown
  }): ThreadMessage {
    const toolCalls = readStoredToolCalls(row.metadata)
    return {
      id: row.id,
      role: row.role,
      content: row.content,
      toolCalls,
      toolCallId: row.toolCallId ?? undefined
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
        const messages = await this.resolveMessagesToWrite(tx, params)
        if (!messages || messages.length === 0) return

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

        await tx.agentMessage.deleteMany({ where: { threadId: params.threadId } })

        for (let sequence = 0; sequence < messages.length; sequence++) {
          const msg = messages[sequence]!
          await tx.agentMessage.create({
            data: {
              id: msg.id || randomUUID(),
              threadId: params.threadId,
              tenantId: params.tenantId,
              sequence,
              role: msg.role,
              content: msg.content ?? '',
              toolCallId: msg.toolCallId ?? null,
              metadata:
                msg.toolCalls && msg.toolCalls.length > 0 ? { toolCalls: msg.toolCalls } : undefined
            }
          })
        }
      })
    } catch (error) {
      this.logger.error({ err: error, threadId: params.threadId }, '保存 AgentThread 会话快照失败')
    }
  }

  private async resolveMessagesToWrite(
    tx: Prisma.TransactionClient,
    params: SaveThreadSnapshotParams
  ): Promise<ThreadMessage[] | null> {
    const existing = await tx.agentMessage.findMany({
      where: { threadId: params.threadId },
      orderBy: { sequence: 'asc' }
    })
    const stored = restoreDisplacedTurnPrefix(existing.map((row) => this.toThreadMessage(row)))
    if (params.mode !== 'append') return mergeAuthoritativeSnapshot(stored, params.messages)

    const seen = new Set(existing.map((row) => row.id))
    const incoming = restoreDisplacedTurnPrefix(
      params.messages.filter((message) => message.id && !seen.has(message.id))
    )
    if (incoming.length === 0) return null
    return [...stored, ...incoming]
  }
}

function threadAgentIds(agentId: string): string[] {
  if (agentId === DEFAULT_AGENT_ID) return [DEFAULT_AGENT_ID, LEGACY_DEFAULT_THREAD_AGENT_ID]
  return [agentId]
}

function readStoredToolCalls(metadata: unknown): ThreadMessage['toolCalls'] | undefined {
  if (!isRecord(metadata) || !Array.isArray(metadata.toolCalls)) return undefined
  const toolCalls = metadata.toolCalls.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string') return []
    const name = typeof item.name === 'string' ? item.name : ''
    const args = typeof item.args === 'string' ? item.args : ''
    const fn = isRecord(item.function) ? item.function : undefined
    const functionName = typeof fn?.name === 'string' ? fn.name : name
    const functionArgs = typeof fn?.arguments === 'string' ? fn.arguments : args
    return [
      {
        id: item.id,
        type: 'function' as const,
        name: functionName,
        args: functionArgs,
        function: { name: functionName, arguments: functionArgs }
      }
    ]
  })
  return toolCalls.length > 0 ? toolCalls : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
