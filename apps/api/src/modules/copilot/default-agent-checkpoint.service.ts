import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '../../infra/prisma/index.js'
import { hashJson, toJson } from './default-agent-runtime.utils.js'

import type { Prisma } from '@prisma/client'

@Injectable()
export class DefaultAgentCheckpointService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async upsertProjection(input: {
    threadId: string
    runId: string
    tenantId: string
    version: number
    state: unknown
    summary?: string
  }) {
    const stateHash = hashJson(input.state)
    const namespace = `${input.tenantId}:${input.threadId}`
    const parent = await this.prisma.agentCheckpoint.findFirst({
      where: {
        threadId: input.threadId,
        tenantId: input.tenantId,
        version: { lt: input.version }
      },
      orderBy: { version: 'desc' },
      select: { id: true }
    })
    return this.prisma.agentCheckpoint.upsert({
      where: { threadId_version: { threadId: input.threadId, version: input.version } },
      create: {
        threadId: input.threadId,
        runId: input.runId,
        tenantId: input.tenantId,
        version: input.version,
        parentId: parent?.id,
        namespace,
        stateHash,
        summary: input.summary,
        state: toJson(input.state)
      },
      update: {
        state: toJson(input.state),
        stateHash,
        namespace,
        summary: input.summary,
        parentId: parent?.id
      }
    })
  }

  async upsertInTransaction(
    tx: Prisma.TransactionClient,
    input: {
      threadId: string
      runId: string
      tenantId: string
      version: number
      state: unknown
      summary?: string
    }
  ) {
    const stateHash = hashJson(input.state)
    const namespace = `${input.tenantId}:${input.threadId}`
    const parent = await tx.agentCheckpoint.findFirst({
      where: {
        threadId: input.threadId,
        tenantId: input.tenantId,
        version: { lt: input.version }
      },
      orderBy: { version: 'desc' },
      select: { id: true }
    })
    return tx.agentCheckpoint.upsert({
      where: { threadId_version: { threadId: input.threadId, version: input.version } },
      create: {
        threadId: input.threadId,
        runId: input.runId,
        tenantId: input.tenantId,
        version: input.version,
        parentId: parent?.id,
        namespace,
        stateHash,
        summary: input.summary,
        state: toJson(input.state)
      },
      update: {
        state: toJson(input.state),
        stateHash,
        namespace,
        summary: input.summary,
        parentId: parent?.id
      }
    })
  }

  /** 按租户+线程命名空间读取最新投影，供跨进程恢复。 */
  async loadLatest(tenantId: string, threadId: string) {
    return this.prisma.agentCheckpoint.findFirst({
      where: {
        tenantId,
        threadId,
        namespace: `${tenantId}:${threadId}`
      },
      orderBy: { version: 'desc' }
    })
  }
}
