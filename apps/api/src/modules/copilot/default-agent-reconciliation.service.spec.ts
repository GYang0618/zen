import { DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'

import { DefaultAgentReconciliationService } from './default-agent-reconciliation.service.js'

import type { AuthContext } from '@zen/shared'
import type { PrismaService } from '../../infra/prisma/index.js'

const { jest } = import.meta
const auth = { tenantId: 'tenant-1', userId: 'user-1' } as AuthContext

describe('DefaultAgentReconciliationService', () => {
  it('对账孤儿 Run、过期审批和过期幂等记录', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 })
    const deleteMany = jest.fn().mockResolvedValue({ count: 2 })
    const prisma = {
      $transaction: jest.fn(async (ops: Array<Promise<{ count: number }>>) => Promise.all(ops)),
      agentRun: { updateMany },
      agentTurn: { updateMany },
      agentToolExecution: { updateMany },
      agentApproval: { updateMany },
      agentIdempotencyRecord: { deleteMany }
    } as unknown as PrismaService

    const result = await new DefaultAgentReconciliationService(prisma).reconcile(auth)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(updateMany).toHaveBeenCalled()
    expect(deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1', userId: 'user-1' })
      })
    )
    expect(result.deletedIdempotencyRecords).toBe(2)
    expect(DEFAULT_AGENT_RUN_BUDGET.timeoutMs).toBeGreaterThan(0)
  })
})
