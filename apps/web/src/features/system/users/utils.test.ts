import { describe, expect, it } from 'vitest'

import { formatFromNow } from '@zen/shared'

import { getUserPresence } from './utils'

const NOW = Date.parse('2026-08-19T07:00:00.000Z')
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

describe('getUserPresence', () => {
  it('marks a recently active user as online', () => {
    const lastActiveAt = new Date(NOW - 2 * MINUTE).toISOString()
    expect(getUserPresence(lastActiveAt, NOW)).toBe('online')
  })

  it('marks a user without lastActiveAt as offline', () => {
    expect(getUserPresence(null, NOW)).toBe('offline')
    expect(getUserPresence(undefined, NOW)).toBe('offline')
  })

  it('marks a user idle past the online window as away', () => {
    const lastActiveAt = new Date(NOW - 10 * MINUTE).toISOString()
    expect(getUserPresence(lastActiveAt, NOW)).toBe('away')
  })

  it('marks a user idle past the away window as offline', () => {
    const lastActiveAt = new Date(NOW - 31 * MINUTE).toISOString()
    expect(getUserPresence(lastActiveAt, NOW)).toBe('offline')
  })

  it('marks an invalid timestamp as offline', () => {
    expect(getUserPresence('not-a-date', NOW)).toBe('offline')
  })
})

describe('formatFromNow', () => {
  it('formats times within a week with second/minute/hour/day units', () => {
    expect(formatFromNow(new Date(NOW - 20 * SECOND).toISOString(), NOW)).toBe('20s前')
    expect(formatFromNow(new Date(NOW - MINUTE).toISOString(), NOW)).toBe('1分钟前')
    expect(formatFromNow(new Date(NOW - HOUR).toISOString(), NOW)).toBe('1小时前')
    expect(formatFromNow(new Date(NOW - DAY).toISOString(), NOW)).toBe('1天前')
    expect(formatFromNow(new Date(NOW - 4 * DAY).toISOString(), NOW)).toBe('4天前')
  })

  it('formats times of 7 days or more as an absolute datetime', () => {
    const past = new Date(NOW - WEEK)
    const future = new Date(NOW + WEEK)
    const format = (date: Date) =>
      `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

    expect(formatFromNow(past.toISOString(), NOW)).toBe(format(past))
    expect(formatFromNow(future.toISOString(), NOW)).toBe(format(future))
  })

  it('formats future timestamps within a week with 后', () => {
    expect(formatFromNow(new Date(NOW + 20 * SECOND).toISOString(), NOW)).toBe('20s后')
    expect(formatFromNow(new Date(NOW + 3 * DAY).toISOString(), NOW)).toBe('3天后')
  })

  it('returns a dash when the timestamp is missing', () => {
    expect(formatFromNow(null, NOW)).toBe('—')
    expect(formatFromNow(undefined, NOW)).toBe('—')
  })

  it('returns the original string when the timestamp is invalid', () => {
    expect(formatFromNow('not-a-date', NOW)).toBe('not-a-date')
  })

  it('formats date-only values without time after 7 days', () => {
    expect(formatFromNow('2026-01-01', NOW)).toBe('2026年1月1日')
  })
})
