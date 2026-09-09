import { describe, expect, it } from 'vitest'

import {
  appendThreadPage,
  buildOptimisticThread,
  mergeThreadPage,
  promoteThread,
  sortThreadsByRecent,
  THREAD_TITLE_MAX_LENGTH
} from './thread-list'

import type { AgentThreadSummary } from '../runtime-api'

function thread(id: string, updatedAt: string, title = id): AgentThreadSummary {
  return {
    id,
    title,
    status: 'active',
    lastMessageAt: updatedAt,
    createdAt: updatedAt,
    updatedAt,
    _count: { messages: 1, runs: 1 }
  }
}

describe('thread list paging helpers', () => {
  it('merges the first page by id and keeps newer threads first', () => {
    const current = [
      thread('local', '2026-09-03T12:00:00.000Z'),
      thread('a', '2026-09-03T08:00:00.000Z')
    ]
    const incoming = [
      thread('b', '2026-09-03T11:00:00.000Z'),
      thread('a', '2026-09-03T10:00:00.000Z', 'renamed')
    ]

    expect(mergeThreadPage(current, incoming).map((item) => item.id)).toEqual(['local', 'b', 'a'])
    expect(mergeThreadPage(current, incoming).find((item) => item.id === 'a')?.title).toBe(
      'renamed'
    )
  })

  it('appends only unseen older threads', () => {
    const current = [
      thread('a', '2026-09-03T11:00:00.000Z'),
      thread('b', '2026-09-03T10:00:00.000Z')
    ]
    const incoming = [
      thread('b', '2026-09-03T10:00:00.000Z'),
      thread('c', '2026-09-03T09:00:00.000Z')
    ]

    expect(appendThreadPage(current, incoming).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('promotes a renamed thread to the top without reshuffling the rest', () => {
    const current = [
      thread('a', '2026-09-03T12:00:00.000Z'),
      thread('b', '2026-09-03T11:00:00.000Z'),
      thread('c', '2026-09-03T10:00:00.000Z')
    ]
    const next = promoteThread(current, 'c', {
      title: 'renamed',
      updatedAt: '2026-09-03T13:00:00.000Z'
    })

    expect(next.map((item) => item.id)).toEqual(['c', 'a', 'b'])
    expect(next[0]?.title).toBe('renamed')
    expect(next[0]?.updatedAt).toBe('2026-09-03T13:00:00.000Z')
  })

  it('breaks updatedAt ties with id descending', () => {
    const sameTime = '2026-09-03T10:00:00.000Z'
    expect(
      sortThreadsByRecent([thread('a', sameTime), thread('c', sameTime)]).map((item) => item.id)
    ).toEqual(['c', 'a'])
  })
})

describe('buildOptimisticThread', () => {
  it('creates an active thread summary using the first message as title', () => {
    const thread = buildOptimisticThread('test-id-1', '帮我创建一个新用户')

    expect(thread.id).toBe('test-id-1')
    expect(thread.title).toBe('帮我创建一个新用户')
    expect(thread.status).toBe('active')
    expect(thread._count).toEqual({ messages: 1, runs: 1 })
    expect(thread.createdAt).toBeDefined()
    expect(thread.updatedAt).toBe(thread.createdAt)
  })

  it('falls back to "新对话" when message is empty or only whitespace', () => {
    const threadEmpty = buildOptimisticThread('test-id-2', '')
    const threadSpaces = buildOptimisticThread('test-id-3', '   \n\t  ')

    expect(threadEmpty.title).toBe('新对话')
    expect(threadSpaces.title).toBe('新对话')
  })

  it('truncates titles that exceed THREAD_TITLE_MAX_LENGTH', () => {
    const longMessage = 'A'.repeat(120)
    const thread = buildOptimisticThread('test-id-4', longMessage)

    expect(thread.title).toHaveLength(THREAD_TITLE_MAX_LENGTH)
    expect(thread.title).toBe('A'.repeat(THREAD_TITLE_MAX_LENGTH))
  })

  it('normalizes multiple internal whitespace characters into single spaces', () => {
    const thread = buildOptimisticThread('test-id-5', '你好   世界 \n  请帮我  \t 分析数据 ')

    expect(thread.title).toBe('你好 世界 请帮我 分析数据')
  })
})
