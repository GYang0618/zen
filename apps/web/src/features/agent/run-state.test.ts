import { describe, expect, it } from 'vitest'

import { deriveChatRunState, isRunCancellation } from './run-state'

describe('deriveChatRunState', () => {
  it('区分断线恢复、审批、失败和取消', () => {
    expect(deriveChatRunState({ online: false, isRunning: true, recovered: false })).toBe(
      'reconnecting'
    )
    expect(
      deriveChatRunState({
        online: true,
        isRunning: false,
        recovered: false,
        persistedStatus: 'interrupted'
      })
    ).toBe('waiting-approval')
    expect(
      deriveChatRunState({
        online: true,
        isRunning: false,
        recovered: false,
        persistedStatus: 'failed'
      })
    ).toBe('failed')
    expect(
      deriveChatRunState({
        online: true,
        isRunning: false,
        recovered: false,
        persistedStatus: 'cancelled'
      })
    ).toBe('cancelled')
  })
})

describe('isRunCancellation', () => {
  it('识别主动取消与 AbortError', () => {
    expect(isRunCancellation(new Error('Default Agent run cancelled'))).toBe(true)
    expect(isRunCancellation({ name: 'AbortError', message: 'aborted' })).toBe(true)
    expect(isRunCancellation(new Error('model unavailable'))).toBe(false)
  })
})
