import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'
import { toJson } from './default-agent-runtime.utils.js'

import type { AuthContext } from '@zen/shared'

const MAX_PROMPT_MEMORY_CHARS = 6_000

@Injectable()
export class DefaultAgentMemoryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list(auth: AuthContext) {
    return this.prisma.agentMemory.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  async getPrompt(auth: AuthContext, threadId?: string): Promise<string | undefined> {
    const memories = await this.prisma.agentMemory.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        sensitivity: 'non_sensitive',
        shareWithModel: true,
        modelProvider: 'qwen',
        approvedForModelAt: { not: null },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        AND: [{ OR: [{ threadId: null }, ...(threadId ? [{ threadId }] : [])] }]
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { scope: true, kind: true, key: true, content: true }
    })
    if (!memories.length) return undefined
    return memories
      .map(
        (memory) =>
          `- [${memory.scope}/${memory.kind}] ${memory.key}: ${JSON.stringify(memory.content)}`
      )
      .join('\n')
      .slice(0, MAX_PROMPT_MEMORY_CHARS)
  }

  async upsert(input: MemoryInput, auth: AuthContext) {
    if (!input.scope || !input.kind || !input.key) throw new BadRequestException('Invalid memory')
    if (input.threadId) await this.requireThread(input.threadId, auth)
    const serialized = JSON.stringify(input.content ?? null)
    if (serialized.length > DEFAULT_AGENT_RUN_BUDGET.maxMemoryContentChars) {
      throw new BadRequestException('Memory content exceeds token budget')
    }
    const existing = await this.prisma.agentMemory.findUnique({
      where: {
        tenantId_userId_scope_key: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          scope: input.scope,
          key: input.key
        }
      },
      select: { id: true }
    })
    if (!existing) {
      const count = await this.prisma.agentMemory.count({
        where: { tenantId: auth.tenantId, userId: auth.userId }
      })
      if (count >= DEFAULT_AGENT_RUN_BUDGET.maxMemoriesPerUser) {
        throw new BadRequestException('Memory capacity exceeded')
      }
    }
    const shareWithModel = input.shareWithModel === true
    if (
      shareWithModel &&
      (input.sensitivity !== 'non_sensitive' || input.modelProvider !== 'qwen')
    ) {
      throw new BadRequestException(
        'Only non-sensitive memories explicitly approved for qwen may be shared with the model'
      )
    }
    const consent = {
      sensitivity: input.sensitivity ?? 'private',
      shareWithModel,
      modelProvider: shareWithModel ? 'qwen' : null,
      approvedForModelAt: shareWithModel ? new Date() : null
    } as const
    return this.prisma.agentMemory.upsert({
      where: {
        tenantId_userId_scope_key: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          scope: input.scope,
          key: input.key
        }
      },
      create: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        threadId: input.threadId,
        scope: input.scope,
        kind: input.kind,
        key: input.key,
        content: toJson(input.content),
        ...consent,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
      },
      update: {
        threadId: input.threadId,
        kind: input.kind,
        content: toJson(input.content),
        ...consent,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
      }
    })
  }

  async delete(id: string, auth: AuthContext): Promise<void> {
    const result = await this.prisma.agentMemory.deleteMany({
      where: { id, tenantId: auth.tenantId, userId: auth.userId }
    })
    if (!result.count) throw new NotFoundException('Agent memory not found')
  }

  private async requireThread(threadId: string, auth: AuthContext) {
    const thread = await this.prisma.agentThread.findFirst({
      where: { id: threadId, tenantId: auth.tenantId, userId: auth.userId },
      select: { id: true }
    })
    if (!thread) throw new NotFoundException('Agent thread not found')
  }
}

export interface MemoryInput {
  scope: string
  kind: string
  key: string
  content: unknown
  threadId?: string
  expiresAt?: string
  sensitivity?: 'private' | 'non_sensitive'
  shareWithModel?: boolean
  modelProvider?: 'qwen'
}
