import { describe, expect, it } from 'vitest'

import { buildApprovalDecisions } from './approval-decision'

describe('buildApprovalDecisions', () => {
  it('marks a rejection as final for the current user turn', () => {
    expect(buildApprovalDecisions(1, 'reject')).toEqual([
      {
        type: 'reject',
        message:
          '用户已拒绝执行该操作。这是当前用户消息的最终决定：不得在本轮再次调用同一工具或任何等效写操作。请直接说明操作已取消；仅当用户发送新的明确请求时，才可重新发起审批。'
      }
    ])
  })
})
