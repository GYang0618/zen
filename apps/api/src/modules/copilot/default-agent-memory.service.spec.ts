import { BadRequestException } from '@nestjs/common'
import { DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'

import { DefaultAgentMemoryService } from './default-agent-memory.service.js'

import type { AuthContext } from '@zen/shared'
import type { PrismaService } from '../../infra/prisma/index.js'

const { jest } = import.meta
const auth = { tenantId: 'tenant-1', userId: 'user-1' } as AuthContext

describe('DefaultAgentMemoryService quotas', () => {
  it('单条内容超过预算时拒绝写入', async () => {
    const prisma = {
      agentMemory: { findUnique: jest.fn(), count: jest.fn(), upsert: jest.fn() }
    } as unknown as PrismaService
    const service = new DefaultAgentMemoryService(prisma)

    await expect(
      service.upsert(
        {
          scope: 'user',
          kind: 'note',
          key: 'too-large',
          content: 'x'.repeat(DEFAULT_AGENT_RUN_BUDGET.maxMemoryContentChars)
        },
        auth
      )
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.agentMemory.upsert).not.toHaveBeenCalled()
  })

  it('达到每用户容量上限时拒绝新增', async () => {
    const prisma = {
      agentMemory: {
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(DEFAULT_AGENT_RUN_BUDGET.maxMemoriesPerUser),
        upsert: jest.fn()
      }
    } as unknown as PrismaService
    const service = new DefaultAgentMemoryService(prisma)

    await expect(
      service.upsert({ scope: 'user', kind: 'note', key: 'overflow', content: 'ok' }, auth)
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.agentMemory.upsert).not.toHaveBeenCalled()
  })
})
