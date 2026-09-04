import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma'

import { toJson } from '../default-agent-runtime.utils'

import type { AuthContext } from '@zen/shared'
import type { MemoryUpsertInput } from '../default-agent-runtime.schemas'

const MAX_PROMPT_MEMORY_CHARS = 6_000

@Injectable()
export class AgentMemoryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listMemories(auth: AuthContext) {
    return this.prisma.agentMemory.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  async getPromptMemory(auth: AuthContext, threadId?: string): Promise<string | undefined> {
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

  async upsertMemory(input: MemoryUpsertInput, auth: AuthContext) {
    if (!input.scope || !input.kind || !input.key) {
      throw new BadRequestException('Invalid memory parameters')
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

  async deleteMemory(id: string, auth: AuthContext): Promise<void> {
    const result = await this.prisma.agentMemory.deleteMany({
      where: { id, tenantId: auth.tenantId, userId: auth.userId }
    })
    if (!result.count) throw new NotFoundException('Agent memory not found')
  }
}
