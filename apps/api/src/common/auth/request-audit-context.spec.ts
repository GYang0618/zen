import {
  getRequestAuditContext,
  runWithRequestAuditContext,
  setRequestAuditContext
} from './request-audit-context.js'

describe('request-audit-context', () => {
  it('未包裹请求上下文时读取为空', () => {
    expect(getRequestAuditContext()).toBeUndefined()
  })

  it('在被 await 的异步函数中回填后，调用方仍可读取', async () => {
    await runWithRequestAuditContext(async () => {
      const guard = async () => {
        await Promise.resolve()
        setRequestAuditContext({ actorId: 'user-1', tenantId: 'tenant-1' })
      }

      await guard()

      expect(getRequestAuditContext()).toEqual({
        actorId: 'user-1',
        tenantId: 'tenant-1'
      })
    })
  })

  it('不同请求之间互相隔离', async () => {
    await Promise.all([
      runWithRequestAuditContext(async () => {
        setRequestAuditContext({ actorId: 'user-a' })
        await Promise.resolve()
        expect(getRequestAuditContext()?.actorId).toBe('user-a')
      }),
      runWithRequestAuditContext(async () => {
        setRequestAuditContext({ actorId: 'user-b' })
        await Promise.resolve()
        expect(getRequestAuditContext()?.actorId).toBe('user-b')
      })
    ])
  })
})
