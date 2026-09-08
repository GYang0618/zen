import { ForbiddenException } from '@nestjs/common'

import { StepUpGuard } from './step-up.guard.js'

import type { ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { JwtService } from '@nestjs/jwt'
import type { AuthConfig } from '../../config/index.js'
import type { PrismaService } from '../../infra/prisma/index.js'

const { jest } = import.meta

const auth = { tenantId: 'tenant-1', userId: 'user-1' }

function context(headers: Record<string, string | undefined> = {}, requestAuth = auth) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { sub: 'user-1' },
        auth: requestAuth,
        header: (name: string) => headers[name.toLowerCase()]
      })
    }),
    getHandler: () => ({}),
    getClass: () => ({})
  } as unknown as ExecutionContext
}

function createGuard(findFirst: jest.Mock) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(true)
  } as unknown as Reflector
  const jwtService = {
    verifyAsync: jest.fn()
  } as unknown as JwtService
  const authCfg = { secret: 'test-secret' } as AuthConfig
  const prisma = {
    agentApproval: { findFirst },
    agentStepUpGrant: { updateMany: jest.fn() }
  } as unknown as PrismaService
  return {
    guard: new StepUpGuard(reflector, jwtService, authCfg, prisma),
    jwtService,
    reflector,
    prisma
  }
}

describe('StepUpGuard', () => {
  it('未标记 RequireStepUp 时直接放行', async () => {
    const findFirst = jest.fn()
    const { guard, reflector } = createGuard(findFirst)
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)

    await expect(guard.canActivate(context())).resolves.toBe(true)
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('校验有效的 x-step-up-token', async () => {
    const findFirst = jest.fn()
    const { guard, jwtService } = createGuard(findFirst)
    ;(jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      typ: 'step-up',
      sub: 'user-1',
      purpose: 'sensitive'
    })

    await expect(guard.canActivate(context({ 'x-step-up-token': 'token-1' }))).resolves.toBe(true)
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('拒绝伪造或过期的 step-up token', async () => {
    const { guard, jwtService } = createGuard(jest.fn())
    ;(jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('expired'))

    await expect(guard.canActivate(context({ 'x-step-up-token': 'bad' }))).rejects.toBeInstanceOf(
      ForbiddenException
    )
  })

  it('没有 step-up token 时要求二次确认', async () => {
    const findFirst = jest.fn()
    const { guard } = createGuard(findFirst)

    await expect(guard.canActivate(context())).rejects.toMatchObject({ message: '需要二次确认' })
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('拒绝未绑定请求上下文的 Agent HITL token', async () => {
    const { guard, jwtService, prisma } = createGuard(jest.fn())
    ;(jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      typ: 'step-up',
      purpose: 'agent-hitl',
      sub: 'user-1',
      tenantId: 'tenant-1',
      runId: 'run-1',
      toolName: 'delete_users',
      approvalId: 'approval-1',
      nonce: 'nonce-1'
    })
    await expect(
      guard.canActivate(context({ 'x-step-up-token': 'token-1' }))
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect((prisma as any).agentStepUpGrant.updateMany).not.toHaveBeenCalled()
  })

  it('按完整绑定原子消费 Agent HITL token', async () => {
    const { guard, jwtService, prisma } = createGuard(jest.fn())
    ;(jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      typ: 'step-up',
      purpose: 'agent-hitl',
      sub: 'user-1',
      tenantId: 'tenant-1',
      runId: 'run-1',
      toolName: 'delete_users',
      approvalId: 'approval-1',
      nonce: 'nonce-1'
    })
    ;((prisma as any).agentStepUpGrant.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
    await expect(
      guard.canActivate(
        context({
          'x-step-up-token': 'token-1',
          'x-agent-run-id': 'run-1',
          'x-agent-tool-name': 'delete_users',
          'x-agent-approval-id': 'approval-1'
        })
      )
    ).resolves.toBe(true)
    expect((prisma as any).agentStepUpGrant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          runId: 'run-1',
          toolName: 'delete_users',
          approvalId: 'approval-1',
          nonce: 'nonce-1',
          consumedAt: null
        }),
        data: { consumedAt: expect.any(Date) }
      })
    )
  })
})
