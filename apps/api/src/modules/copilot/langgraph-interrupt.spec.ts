import {
  extractGraphInterrupts,
  isGraphInterruptError,
  isInterruptRunErrorEvent,
  isOnInterruptCustomEvent,
  toAgUiInterrupts,
  toInterruptFinishEvents
} from './langgraph-interrupt.js'

describe('langgraph interrupt mapping', () => {
  it('识别 GraphInterrupt 与 RUN_ERROR interrupt', () => {
    expect(isGraphInterruptError(new Error('interrupt'))).toBe(true)
    expect(isGraphInterruptError({ name: 'GraphInterrupt', message: 'interrupt' })).toBe(true)
    expect(isGraphInterruptError(new Error('timeout'))).toBe(false)
    expect(isInterruptRunErrorEvent({ type: 'RUN_ERROR', message: 'interrupt' })).toBe(true)
    expect(isInterruptRunErrorEvent({ type: 'RUN_FINISHED' })).toBe(false)
    expect(isOnInterruptCustomEvent({ type: 'CUSTOM', name: 'on_interrupt', value: '{}' })).toBe(
      true
    )
    expect(
      isOnInterruptCustomEvent({
        type: 'CUSTOM',
        value: JSON.stringify({
          actionRequests: [{ name: 'update_user_status', args: { ids: ['u1'] } }]
        })
      })
    ).toBe(true)
    expect(isOnInterruptCustomEvent({ type: 'CUSTOM', name: 'PredictState' })).toBe(false)
  })

  it('从 interrupts 字段提取 HITL 载荷并补齐 AG-UI Interrupt', () => {
    expect(extractGraphInterrupts({ interrupts: [{ id: 'i1' }] })).toEqual([{ id: 'i1' }])
    const events = toInterruptFinishEvents(
      { threadId: 'thread-1', runId: 'run-1' },
      { interrupts: [{ id: 'i1' }] }
    )
    expect(events.finished).toEqual(
      expect.objectContaining({
        type: 'RUN_FINISHED',
        threadId: 'thread-1',
        runId: 'run-1',
        outcome: {
          type: 'interrupt',
          interrupts: [
            expect.objectContaining({
              id: 'i1',
              reason: 'approval',
              toolCallId: 'i1'
            })
          ]
        }
      })
    )
    expect(events.clientFinished).toEqual({
      type: 'RUN_FINISHED',
      threadId: 'thread-1',
      runId: 'run-1'
    })
    expect(events.custom).toEqual(
      expect.objectContaining({
        type: 'CUSTOM',
        name: 'on_interrupt'
      })
    )
  })

  it('从 CopilotKit on_interrupt CUSTOM 事件还原 id 与 actionRequests', () => {
    const hitl = {
      actionRequests: [{ name: 'update_user_status', args: { ids: ['u1'], status: 'suspended' } }]
    }
    const interrupts = toAgUiInterrupts({
      type: 'CUSTOM',
      name: 'on_interrupt',
      value: JSON.stringify(hitl),
      rawEvent: { id: 'lg-interrupt-1', value: hitl }
    })
    expect(interrupts).toEqual([
      expect.objectContaining({
        id: 'lg-interrupt-1',
        reason: 'approval:update_user_status',
        toolCallId: 'lg-interrupt-1',
        metadata: expect.objectContaining({
          toolName: 'update_user_status',
          args: { ids: ['u1'], status: 'suspended' }
        })
      })
    ])
  })

  it('RUN_ERROR interrupt 没有载荷时仍产出带 id/reason 的 Interrupt', () => {
    const interrupts = toAgUiInterrupts({ type: 'RUN_ERROR', message: 'interrupt' })
    expect(interrupts[0]?.id).toBeTruthy()
    expect(interrupts[0]?.reason).toBe('approval')
  })

  it('缺少 LangGraph interrupt id 时回退到 toolCallId', () => {
    const hitl = {
      actionRequests: [{ name: 'update_user_status', args: { ids: ['u1'], status: 'suspended' } }]
    }
    const events = toInterruptFinishEvents(
      { threadId: 'thread-1', runId: 'run-1' },
      { type: 'CUSTOM', name: 'on_interrupt', value: JSON.stringify(hitl) },
      { fallbackToolCallId: 'tool-call-1' }
    )
    expect(events.outcome.interrupts[0]).toEqual(
      expect.objectContaining({
        id: 'tool-call-1',
        toolCallId: 'tool-call-1',
        reason: 'approval:update_user_status'
      })
    )
  })
})
