import { describe, expect, it } from 'vitest'

import {
  appendThreadPage,
  mergeThreadPage,
  promoteThread,
  sortThreadsByRecent
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
