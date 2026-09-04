import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma'

import { toJson } from '../default-agent-runtime.utils'

import type { AuthContext } from '@zen/shared'
import type { ArtifactCreateInput } from '../default-agent-runtime.schemas'

@Injectable()
export class AgentArtifactService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createArtifact(
    runId: string,
    threadId: string,
    input: ArtifactCreateInput,
    auth: AuthContext
  ) {
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
        threadId,
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
    })
  }

  async listArtifacts(runId: string, auth: AuthContext) {
    return this.prisma.agentArtifact.findMany({
      where: { runId, tenantId: auth.tenantId, userId: auth.userId, status: 'available' },
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
    })
  }

  async getArtifact(artifactId: string, auth: AuthContext) {
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
}
