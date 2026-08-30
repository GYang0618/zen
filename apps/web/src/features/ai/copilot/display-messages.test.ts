import { describe, expect, it } from 'vitest'

import { DisplayMessageCache } from './display-messages'

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
