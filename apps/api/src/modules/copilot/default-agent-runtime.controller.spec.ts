import { NotFoundException } from '@nestjs/common'

import { DefaultAgentRuntimeController } from './default-agent-runtime.controller.js'

import type { AuthContext } from '@zen/shared'
import type { DefaultAgentRunControl } from './default-agent-run-control.js'
import type { DefaultAgentRuntimeStore } from './default-agent-runtime.store.js'

const { jest } = import.meta

const auth = { tenantId: 'tenant-1', userId: 'user-1' } as AuthContext

describe('DefaultAgentRuntimeController cancellation', () => {
  it('先验证并持久化 Run 归属，再取消本机执行', async () => {
    const order: string[] = []
    const run = { id: 'run-1', status: 'cancelled' }
    const store = {
      cancelRun: jest.fn(async () => {
        order.push('store')
        return run
      })
    } as unknown as DefaultAgentRuntimeStore
    const runControl = {
      cancel: jest.fn(() => {
        order.push('abort')
        return true
      })
    } as unknown as DefaultAgentRunControl
    const controller = new DefaultAgentRuntimeController(store, runControl)

    await expect(controller.cancelRun('run-1', auth)).resolves.toBe(run)

    expect(order).toEqual(['store', 'abort'])
  })

  it('Run 归属验证失败时不触发本机取消', async () => {
    const store = {
      cancelRun: jest.fn().mockRejectedValue(new NotFoundException('Agent run not found'))
    } as unknown as DefaultAgentRuntimeStore
    const runControl = {
      cancel: jest.fn()
    } as unknown as DefaultAgentRunControl
    const controller = new DefaultAgentRuntimeController(store, runControl)

    await expect(controller.cancelRun('guessed-run', auth)).rejects.toBeInstanceOf(
      NotFoundException
    )
    expect(runControl.cancel).not.toHaveBeenCalled()
  })
})
