import { createHash } from 'node:crypto'

import { ConflictException } from '@nestjs/common'
import { lastValueFrom, of } from 'rxjs'

import { AgentIdempotencyService } from '../auth/agent-idempotency.service.js'
import { AgentIdempotencyInterceptor } from './agent-idempotency.interceptor.js'

import type { CallHandler, ExecutionContext } from '@nestjs/common'
import type { PrismaService } from '../../infra/prisma/index.js'

const { jest } = import.meta

const auth = { tenantId: 'tenant-1', userId: 'user-1' }

function context(key = 'run-1:call-1', body: unknown = { name: 'A' }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        path: '/users',
        query: {},
        body,
        auth,
        get: (name: string) => (name === 'x-agent-idempotency-key' ? key : undefined)
      })
    })
  } as unknown as ExecutionContext
}

function interceptor(prisma: PrismaService) {
  return new AgentIdempotencyInterceptor(new AgentIdempotencyService(prisma))
}

describe('AgentIdempotencyInterceptor', () => {
  it('首次写请求执行一次并持久化响应', async () => {
    const findUnique = jest.fn().mockResolvedValue(null)
    const create = jest.fn().mockResolvedValue({})
    const update = jest.fn().mockResolvedValue({})
    const prisma = {
      agentIdempotencyRecord: {
        findUnique,
        create,
        update,
        delete: jest.fn(),
        deleteMany: jest.fn()
      }
    } as unknown as PrismaService
    const next = { handle: jest.fn(() => of({ id: 'created' })) } as CallHandler

    await expect(lastValueFrom(interceptor(prisma).intercept(context(), next))).resolves.toEqual({
      id: 'created'
    })
    expect(next.handle).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          key: 'run-1:call-1'
        })
      })
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_userId_key: { tenantId: 'tenant-1', userId: 'user-1', key: 'run-1:call-1' }
        }
      })
    )
  })

  it('同一用户和请求键命中成功结果时不重复执行', async () => {
    const firstContext = context()
    const request = firstContext.switchToHttp().getRequest()
    const requestHash = createHash('sha256')
      .update(
        JSON.stringify({
          method: request.method,
          path: request.path,
          query: request.query,
          body: request.body
        })
      )
      .digest('hex')
    const prisma = {
      agentIdempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue({
          requestHash,
          status: 'succeeded',
          response: { id: 'cached' },
          expiresAt: new Date(Date.now() + 60_000)
        })
      }
    } as unknown as PrismaService
    const next = { handle: jest.fn(() => of({ id: 'new' })) } as CallHandler

    await expect(lastValueFrom(interceptor(prisma).intercept(firstContext, next))).resolves.toEqual(
      { id: 'cached' }
    )
    expect(next.handle).not.toHaveBeenCalled()
  })

  it('运行中的相同请求返回冲突', async () => {
    const request = context().switchToHttp().getRequest()
    const requestHash = createHash('sha256')
      .update(
        JSON.stringify({
          method: request.method,
          path: request.path,
          query: request.query,
          body: request.body
        })
      )
      .digest('hex')
    const prisma = {
      agentIdempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue({
          requestHash,
          status: 'running',
          expiresAt: new Date(Date.now() + 60_000)
        })
      }
    } as unknown as PrismaService

    await expect(
      lastValueFrom(
        interceptor(prisma).intercept(context(), {
          handle: jest.fn(() => of(null))
        } as CallHandler)
      )
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('SSE 与 Copilot 路由不进入 JSON 幂等缓存', async () => {
    const prisma = { agentIdempotencyRecord: { findUnique: jest.fn() } } as unknown as PrismaService
    const next = { handle: jest.fn(() => of({ streamed: true })) } as CallHandler
    const sseContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          path: '/api/copilot',
          originalUrl: '/api/copilot',
          query: {},
          body: {},
          auth,
          get: (name: string) =>
            name === 'x-agent-idempotency-key'
              ? 'run-1:call-1'
              : name === 'accept'
                ? 'text/event-stream'
                : undefined
        })
      })
    } as unknown as ExecutionContext

    await expect(lastValueFrom(interceptor(prisma).intercept(sseContext, next))).resolves.toEqual({
      streamed: true
    })
    expect(prisma.agentIdempotencyRecord.findUnique).not.toHaveBeenCalled()
  })
})
