import { createHash } from 'node:crypto'

import { DefaultAgentCheckpointService } from './default-agent-checkpoint.service.js'

import type { PrismaService } from '../../infra/prisma/index.js'

const { jest } = import.meta

describe('DefaultAgentCheckpointService', () => {
  it('写入投影时保存 parent、namespace 和 stateHash', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'ckpt-parent' })
    const upsert = jest.fn().mockResolvedValue({})
    const prisma = {
      agentCheckpoint: { findFirst, upsert }
    } as unknown as PrismaService
    const service = new DefaultAgentCheckpointService(prisma)
    const state = { messages: [{ id: 'm1' }] }

    await service.upsertProjection({
      threadId: 'thread-1',
      runId: 'run-1',
      tenantId: 'tenant-1',
      version: 2,
      state,
      summary: 'turn-2'
    })

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          threadId: 'thread-1',
          tenantId: 'tenant-1',
          version: { lt: 2 }
        })
      })
    )
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          parentId: 'ckpt-parent',
          namespace: 'tenant-1:thread-1',
          stateHash: createHash('sha256').update(JSON.stringify(state)).digest('hex'),
          summary: 'turn-2'
        })
      })
    )
  })

  it('跨进程按 namespace 读取最新 checkpoint 投影', async () => {
    const latest = {
      id: 'ckpt-3',
      version: 3,
      namespace: 'tenant-1:thread-1',
      state: { cursor: 3 }
    }
    const findFirst = jest.fn().mockResolvedValue(latest)
    const prisma = {
      agentCheckpoint: { findFirst, upsert: jest.fn() }
    } as unknown as PrismaService
    const restored = await new DefaultAgentCheckpointService(prisma).loadLatest(
      'tenant-1',
      'thread-1'
    )

    expect(restored).toBe(latest)
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          threadId: 'thread-1',
          namespace: 'tenant-1:thread-1'
        },
        orderBy: { version: 'desc' }
      })
    )
  })
})
