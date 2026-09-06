import { ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { AgentIdempotencyService } from './agent-idempotency.service.js'

import type { PrismaService } from '../../infra/prisma/index.js'

const { jest } = import.meta

describe('AgentIdempotencyService', () => {
  it('reserve 在首次请求时创建 running 记录', async () => {
    const create = jest.fn().mockResolvedValue({})
    const prisma = {
      agentIdempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue(null),
        create
      }
    } as unknown as PrismaService
    const service = new AgentIdempotencyService(prisma)

    await expect(service.reserve('tenant-1', 'user-1', 'run-1:call-1', 'hash')).resolves.toEqual({
      kind: 'execute'
    })
    expect(create).toHaveBeenCalled()
  })

  it('命中成功记录时回放响应', async () => {
    const prisma = {
      agentIdempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue({
          requestHash: 'hash',
          status: 'succeeded',
          response: { id: 'cached' },
          expiresAt: new Date(Date.now() + 60_000)
        })
      }
    } as unknown as PrismaService

    await expect(
      new AgentIdempotencyService(prisma).reserve('tenant-1', 'user-1', 'run-1:call-1', 'hash')
    ).resolves.toEqual({ kind: 'replay', response: { id: 'cached' } })
  })

  it('同一键不同请求哈希视为冲突', async () => {
    const prisma = {
      agentIdempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue({
          requestHash: 'other-hash',
          status: 'succeeded',
          response: { id: 'cached' },
          expiresAt: new Date(Date.now() + 60_000)
        })
      }
    } as unknown as PrismaService

    await expect(
      new AgentIdempotencyService(prisma).reserve('tenant-1', 'user-1', 'run-1:call-1', 'hash')
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('并发重复 reserve 命中唯一约束时视为竞争冲突', async () => {
    const prisma = {
      agentIdempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Unique constraint', {
            code: 'P2002',
            clientVersion: 'test'
          })
        )
      }
    } as unknown as PrismaService

    await expect(
      new AgentIdempotencyService(prisma).reserve('tenant-1', 'user-1', 'run-1:call-1', 'hash')
    ).resolves.toEqual({ kind: 'conflict' })
  })
})
