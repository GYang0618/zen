import { describe, expect, it } from 'vitest'

import { buildRetryMessages } from './messages'

describe('buildRetryMessages', () => {
  it('截断到最后一条用户消息，丢掉失败回合的未完成回复', () => {
    expect(
      buildRetryMessages([
        { id: 'u1', role: 'user' },
        { id: 'a1', role: 'assistant' },
        { id: 'u2', role: 'user' },
        { id: 'a2', role: 'assistant' },
        { id: 'r1', role: 'reasoning' }
      ])
    ).toEqual([
      { id: 'u1', role: 'user' },
      { id: 'a1', role: 'assistant' },
      { id: 'u2', role: 'user' }
    ])
  })

  it('保留上一轮已完成的 assistant 与 tool 结果', () => {
    expect(
      buildRetryMessages([
        { id: 'u1', role: 'user' },
        { id: 'a1', role: 'assistant' },
        { id: 't1', role: 'tool' },
        { id: 'u2', role: 'user' },
        { id: 'a2', role: 'assistant' }
      ])
    ).toEqual([
      { id: 'u1', role: 'user' },
      { id: 'a1', role: 'assistant' },
      { id: 't1', role: 'tool' },
      { id: 'u2', role: 'user' }
    ])
  })

  it('过滤历史中的 reasoning / activity，避免回传导致再次 RUN_ERROR', () => {
    expect(
      buildRetryMessages([
        { id: 'u1', role: 'user' },
        { id: 'r1', role: 'reasoning' },
        { id: 'act1', role: 'activity' },
        { id: 'a1', role: 'assistant' },
        { id: 'u2', role: 'user' }
      ])
    ).toEqual([
      { id: 'u1', role: 'user' },
      { id: 'a1', role: 'assistant' },
      { id: 'u2', role: 'user' }
    ])
  })

  it('没有用户消息时返回空数组', () => {
    expect(buildRetryMessages([{ id: 'a1', role: 'assistant' }])).toEqual([])
  })
})
