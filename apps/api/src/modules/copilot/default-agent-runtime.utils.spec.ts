import { decodeThreadCursor, encodeThreadCursor } from './default-agent-runtime.utils.js'

describe('thread list cursor', () => {
  it('编码并还原会话游标', () => {
    const thread = { id: 'thread-1', updatedAt: new Date('2026-09-03T10:00:00.000Z') }
    const cursor = encodeThreadCursor(thread)
    expect(cursor).toBe('2026-09-03T10:00:00.000Z::thread-1')
    expect(decodeThreadCursor(cursor)).toEqual(thread)
  })

  it('拒绝缺少分隔符或非法时间的游标', () => {
    expect(decodeThreadCursor('thread-1')).toBeUndefined()
    expect(decodeThreadCursor('not-a-date::thread-1')).toBeUndefined()
    expect(decodeThreadCursor('2026-09-03T10:00:00.000Z::')).toBeUndefined()
  })
})
