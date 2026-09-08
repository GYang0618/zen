import { describe, expect, it } from 'vitest'

import { deriveChatRunState, isRunCancellation, isRunInterrupt } from './run-state'

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

describe('isRunInterrupt', () => {
  it('识别 GraphInterrupt 与 RUN_ERROR message=interrupt', () => {
    expect(isRunInterrupt(new Error('interrupt'))).toBe(true)
    expect(isRunInterrupt({ name: 'GraphInterrupt', message: 'interrupt' })).toBe(true)
    expect(isRunInterrupt({ type: 'INTERRUPT' })).toBe(true)
    expect(isRunInterrupt(new Error('model unavailable'))).toBe(false)
    expect(isRunInterrupt(new Error('interrupted connection'))).toBe(false)
  })
})
