import { NotFoundException } from '@nestjs/common'

import { DefaultAgentArtifactService } from './default-agent-artifact.service.js'

import type { AuthContext } from '@zen/shared'
import type { PrismaService } from '../../infra/prisma/index.js'

const { jest } = import.meta
const auth = { tenantId: 'tenant-1', userId: 'user-1' } as AuthContext

describe('DefaultAgentArtifactService isolation', () => {
  it('读取 Artifact 时按租户隔离，过期内容不可见', async () => {
    const prisma = {
      agentArtifact: {
        findFirst: jest.fn().mockResolvedValue(null)
      }
    } as unknown as PrismaService

    await expect(new DefaultAgentArtifactService(prisma).get('art-1', auth)).rejects.toBeInstanceOf(
      NotFoundException
    )
    expect(prisma.agentArtifact.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'art-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          status: 'available'
        })
      })
    )
  })

  it('创建 Artifact 前确认 Run 属于当前租户', async () => {
    const prisma = {
      agentRun: { findFirst: jest.fn().mockResolvedValue(null) },
      agentArtifact: { create: jest.fn() }
    } as unknown as PrismaService

    await expect(
      new DefaultAgentArtifactService(prisma).create(
        'run-1',
        { kind: 'json', name: 'result', mimeType: 'application/json', content: { ok: true } },
        auth
      )
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.agentArtifact.create).not.toHaveBeenCalled()
  })
})
