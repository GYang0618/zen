import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../../infra/prisma/index.js'
import { toJson } from './default-agent-runtime.utils.js'

import type { AuthContext } from '@zen/shared'

@Injectable()
export class DefaultAgentArtifactService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(runId: string, input: ArtifactInput, auth: AuthContext) {
    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      select: { threadId: true }
    })
    if (!run) throw new NotFoundException('Agent run not found')
    const serialized = JSON.stringify(input.content ?? null)
    const toolExecution = input.toolCallId
      ? await this.prisma.agentToolExecution.findFirst({
          where: { runId, toolCallId: input.toolCallId, tenantId: auth.tenantId },
          select: { id: true }
        })
      : null
    return this.prisma.agentArtifact.create({
      data: {
        runId,
        threadId: run.threadId,
        tenantId: auth.tenantId,
        userId: auth.userId,
        toolExecutionId: toolExecution?.id,
        kind: input.kind,
        name: input.name,
        mimeType: input.mimeType,
        size: Buffer.byteLength(serialized),
        summary: input.summary,
        content: toJson(input.content)
      },
      select: artifactSelect
    })
  }

  async list(runId: string, auth: AuthContext) {
    await this.requireRun(runId, auth)
    return this.prisma.agentArtifact.findMany({
      where: { runId, tenantId: auth.tenantId, userId: auth.userId, status: 'available' },
      orderBy: { createdAt: 'asc' },
      select: artifactSelect
    })
  }

  async get(artifactId: string, auth: AuthContext) {
    const artifact = await this.prisma.agentArtifact.findFirst({
      where: {
        id: artifactId,
        tenantId: auth.tenantId,
        userId: auth.userId,
        status: 'available',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    })
    if (!artifact) throw new NotFoundException('Agent artifact not found')
    return artifact
  }

  private async requireRun(runId: string, auth: AuthContext) {
    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, tenantId: auth.tenantId, userId: auth.userId },
      select: { id: true }
    })
    if (!run) throw new NotFoundException('Agent run not found')
  }
}

export interface ArtifactInput {
  toolCallId?: string
  kind: string
  name: string
  mimeType: string
  summary?: string
  content: unknown
}

const artifactSelect = {
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
} as const
