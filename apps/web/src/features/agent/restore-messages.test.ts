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

  it('从已持久化消息恢复思考正文', () => {
    const thread: AgentThreadDetail = {
      ...baseThread,
      messages: [
        {
          id: 'stored-user',
          role: 'user',
          content: '查询角色',
          metadata: { externalId: 'user-1' }
        },
        {
          id: 'stored-r',
          role: 'reasoning',
          content: '先核对已激活角色',
          metadata: { externalId: 'reasoning-1' }
        },
        { id: 'stored-a', role: 'assistant', content: '查到 8 个', metadata: { externalId: 'a-1' } }
      ]
    }

    expect(restoreMessages(thread, [])).toEqual([
      { id: 'user-1', role: 'user', content: '查询角色' },
      { id: 'reasoning-1', role: 'reasoning', content: '先核对已激活角色' },
      { id: 'a-1', role: 'assistant', content: '查到 8 个' }
    ])
  })

  it('用事件回放把思考插回已持久化的助手回复之前', () => {
    const thread: AgentThreadDetail = {
      ...baseThread,
      messages: [
        {
          id: 'stored-user',
          role: 'user',
          content: '查询角色',
          metadata: { externalId: 'user-1' }
        },
        { id: 'stored-a', role: 'assistant', content: '查到 8 个', metadata: { externalId: 'a-1' } }
      ]
    }

    expect(
      restoreMessages(thread, [
        event(1, { type: 'REASONING_START', messageId: 'reasoning-1' }),
        event(2, { type: 'REASONING_MESSAGE_START', messageId: 'reasoning-1', role: 'reasoning' }),
        event(3, {
          type: 'REASONING_MESSAGE_CONTENT',
          messageId: 'reasoning-1',
          delta: '先核对已激活角色'
        }),
        event(4, { type: 'TEXT_MESSAGE_START', messageId: 'a-1' }),
        event(5, { type: 'TEXT_MESSAGE_CONTENT', messageId: 'a-1', delta: '查到 8 个' })
      ])
    ).toEqual([
      { id: 'user-1', role: 'user', content: '查询角色' },
      { id: 'reasoning-1', role: 'reasoning', content: '先核对已激活角色' },
      { id: 'a-1', role: 'assistant', content: '查到 8 个' }
    ])
  })

  it('过滤空思考，且不重复拼接已持久化的思考正文', () => {
    const thread: AgentThreadDetail = {
      ...baseThread,
      messages: [
        {
          id: 'stored-r',
          role: 'reasoning',
          content: '已有思考',
          metadata: { externalId: 'reasoning-1' }
        }
      ]
    }

    expect(
      restoreMessages(thread, [
        event(1, { type: 'REASONING_START', messageId: 'reasoning-1' }),
        event(2, {
          type: 'REASONING_MESSAGE_CONTENT',
          messageId: 'reasoning-1',
          delta: '已有思考'
        }),
        event(3, { type: 'REASONING_START', messageId: 'reasoning-empty' })
      ])
    ).toEqual([{ id: 'reasoning-1', role: 'reasoning', content: '已有思考' }])
  })
})
