import { describe, expect, it } from 'vitest'

import { DisplayMessageCache, snapshotMessages } from './display-messages'

describe('snapshotMessages', () => {
  it('copies messages so in-place stream mutations do not leak into previous snapshots', () => {
    const original = { id: 'a', role: 'assistant' as const, content: '你' }
    const [snapshot] = snapshotMessages([original])

    original.content = '你好'

    expect(snapshot).not.toBe(original)
    expect(snapshot.content).toBe('你')
  })
})

describe('DisplayMessageCache', () => {
  it('does not carry optimistic user messages across threads', () => {
    const cache = new DisplayMessageCache()
    const previousThreadMessages = [
      { id: 'user-1', role: 'user' as const, content: 'previous thread' }
    ]

    expect(cache.merge('thread-a', previousThreadMessages)).toEqual(previousThreadMessages)
    expect(cache.merge('thread-b', [])).toEqual([])
  })
})
