import { describe, expect, it } from 'vitest'

import { restoreMessages } from './restore-messages'

import type { AgentEventRecord, AgentThreadDetail } from './runtime-api'

const baseThread = {
  id: 'thread-1',
  title: 'Test',
  status: 'active',
  lastMessageAt: null,
  createdAt: '2026-08-29T00:00:00.000Z',
  updatedAt: '2026-08-29T00:00:00.000Z',
  _count: { messages: 1, runs: 1 },
  runs: [],
  checkpoints: []
} satisfies Omit<AgentThreadDetail, 'messages'>

function event(sequence: number, payload: Record<string, unknown>): AgentEventRecord {
  return {
    sequence,
    type: String(payload.type),
    payload,
    createdAt: '2026-08-29T00:00:00.000Z'
  }
}

describe('restoreMessages', () => {
  it('不重复追加已经持久化的助手正文', () => {
    const thread: AgentThreadDetail = {
      ...baseThread,
      messages: [
        {
          id: 'stored-1',
          role: 'assistant',
          content: '完成',
          metadata: { externalId: 'assistant-1' }
        }
      ]
    }

    expect(
      restoreMessages(thread, [
        event(1, { type: 'TEXT_MESSAGE_START', messageId: 'assistant-1' }),
        event(2, { type: 'TEXT_MESSAGE_CONTENT', messageId: 'assistant-1', delta: '完成' })
      ])
    ).toEqual([{ id: 'assistant-1', role: 'assistant', content: '完成' }])
  })

  it('用事件增量补齐尚未进入消息快照的助手正文', () => {
    const thread: AgentThreadDetail = { ...baseThread, messages: [] }

    expect(
      restoreMessages(thread, [
        event(1, { type: 'TEXT_MESSAGE_START', messageId: 'assistant-2' }),
        event(2, { type: 'TEXT_MESSAGE_CONTENT', messageId: 'assistant-2', delta: '正在' }),
        event(3, { type: 'TEXT_MESSAGE_CONTENT', messageId: 'assistant-2', delta: '恢复' })
      ])
    ).toEqual([{ id: 'assistant-2', role: 'assistant', content: '正在恢复' }])
  })
})
