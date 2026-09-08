import { describe, expect, it } from 'vitest'

import {
  deriveChatRunState,
  deriveDetailedAgentStatus,
  isRunCancellation,
  isRunInterrupt
} from './run-state'

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

describe('deriveDetailedAgentStatus', () => {
  it('在刚启动无首字时处于 waiting-schedule 状态', () => {
    expect(
      deriveDetailedAgentStatus({
        online: true,
        isRunning: true,
        messages: [{ role: 'user', content: '你好' }]
      }).phase
    ).toBe('waiting-schedule')
  })

  it('在模型输出 reasoning 时识别为 reasoning 状态', () => {
    expect(
      deriveDetailedAgentStatus({
        online: true,
        isRunning: true,
        messages: [
          { role: 'user', content: '你好' },
          { role: 'reasoning', content: '思考中...' }
        ]
      }).phase
    ).toBe('reasoning')
  })

  it('在未完成工具调用时识别为 tool-running 状态', () => {
    const status = deriveDetailedAgentStatus({
      online: true,
      isRunning: true,
      messages: [
        { role: 'user', content: '查询用户' },
        {
          role: 'assistant',
          toolCalls: [{ id: 'call_1', function: { name: 'query_user_list' } }]
        }
      ]
    })
    expect(status.phase).toBe('tool-running')
    expect(status.activeToolName).toBe('query_user_list')
  })

  it('在工具执行完毕且流式正文输出时识别为 streaming 状态', () => {
    expect(
      deriveDetailedAgentStatus({
        online: true,
        isRunning: true,
        messages: [
          { role: 'user', content: '查询用户' },
          {
            role: 'assistant',
            toolCalls: [{ id: 'call_1', function: { name: 'query_user_list' } }]
          },
          { role: 'tool', toolCallId: 'call_1', content: '{}' },
          { role: 'assistant', content: '查询到以下用户：' }
        ]
      }).phase
    ).toBe('streaming')
  })
})
