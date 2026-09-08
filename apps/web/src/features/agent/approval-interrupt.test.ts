import { describe, expect, it } from 'vitest'

import { approvalToInterruptView, resolveApprovalInterrupt } from './approval-interrupt'

describe('resolveApprovalInterrupt', () => {
  it('优先使用标准 Interrupt 的 id 与 metadata', () => {
    const view = resolveApprovalInterrupt(
      {
        id: 'std-1',
        metadata: {
          toolName: 'update_user_status',
          args: { ids: ['u1'] },
          value: {
            actionRequests: [{ name: 'update_user_status', args: { ids: ['u1'] } }]
          }
        }
      },
      { value: { actionRequests: [{ name: 'other' }] } }
    )
    expect(view).toEqual({
      id: 'std-1',
      toolName: 'update_user_status',
      args: { ids: ['u1'] },
      actions: [{ name: 'update_user_status', args: { ids: ['u1'] } }]
    })
  })

  it('legacy on_interrupt 的 JSON 字符串仍能解析 actionRequests 与 id', () => {
    const view = resolveApprovalInterrupt(null, {
      value: JSON.stringify({
        id: 'lg-interrupt-1',
        actionRequests: [{ name: 'update_user_status', args: { ids: ['u1'], status: 'suspended' } }]
      })
    })
    expect(view.id).toBe('lg-interrupt-1')
    expect(view.toolName).toBe('update_user_status')
    expect(view.actions).toHaveLength(1)
    expect(view.args).toEqual({ ids: ['u1'], status: 'suspended' })
  })

  it('把持久化审批还原成卡片视图', () => {
    expect(
      approvalToInterruptView({
        interruptId: 'lg-1',
        toolName: 'delete_users',
        arguments: { ids: ['u2'] }
      })
    ).toEqual({
      id: 'lg-1',
      toolName: 'delete_users',
      args: { ids: ['u2'] },
      actions: [{ name: 'delete_users', args: { ids: ['u2'] } }]
    })
  })
})
