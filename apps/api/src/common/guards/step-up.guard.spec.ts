import { ForbiddenException } from '@nestjs/common'
import { AGENT_HITL_STEP_UP_WINDOW_MS } from '@zen/shared'

import { StepUpGuard } from './step-up.guard'

import type { ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { JwtService } from '@nestjs/jwt'
import type { AuthConfig } from '@/config'
import type { PrismaService } from '@/infra/prisma'

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
    agentApproval: { findFirst }
  } as unknown as PrismaService
  return {
    guard: new StepUpGuard(reflector, jwtService, authCfg, prisma),
    jwtService,
    reflector
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

  it('对话审批刚通过时，即使没有 step-up token 也放行', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'approval-1' })
    const { guard } = createGuard(findFirst)

    await expect(guard.canActivate(context())).resolves.toBe(true)
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          status: 'approved',
          decidedAt: { gte: expect.any(Date) }
        })
      })
    )
    const decidedAt = findFirst.mock.calls[0][0].where.decidedAt.gte as Date
    expect(Date.now() - decidedAt.getTime()).toBeLessThan(AGENT_HITL_STEP_UP_WINDOW_MS + 1_000)
  })

  it('没有近期已批准审批时仍要求二次确认', async () => {
    const findFirst = jest.fn().mockResolvedValue(null)
    const { guard } = createGuard(findFirst)

    await expect(guard.canActivate(context())).rejects.toMatchObject({ message: '需要二次确认' })
  })
})
