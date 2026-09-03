import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatRelativeTime } from './chat-history-row'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-03T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats seconds, minutes, hours and capped days', () => {
    expect(formatRelativeTime('2026-09-03T11:59:50.000Z')).toBe('10s')
    expect(formatRelativeTime('2026-09-03T11:50:00.000Z')).toBe('10m')
    expect(formatRelativeTime('2026-09-03T09:00:00.000Z')).toBe('3h')
    expect(formatRelativeTime('2026-08-20T12:00:00.000Z')).toBe('7d')
  })
})
