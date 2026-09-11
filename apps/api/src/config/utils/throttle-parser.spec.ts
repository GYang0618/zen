import { parseThrottleRate } from './throttle-parser.js'

describe('parseThrottleRate', () => {
  it.each(['off', 'none', '0', 'false', 'disabled', 'OFF', 'None'])(
    'parses "%s" as disabled throttle',
    (val) => {
      expect(parseThrottleRate(val)).toEqual({
        enabled: false,
        limit: 0,
        ttl: 0
      })
    }
  )

  it('parses standard rates with implicit 1 unit duration', () => {
    expect(parseThrottleRate('100/m')).toEqual({
      enabled: true,
      limit: 100,
      ttl: 60_000
    })

    expect(parseThrottleRate('10/s')).toEqual({
      enabled: true,
      limit: 10,
      ttl: 1_000
    })

    expect(parseThrottleRate('1000/h')).toEqual({
      enabled: true,
      limit: 1000,
      ttl: 3_600_000
    })

    expect(parseThrottleRate('5000/d')).toEqual({
      enabled: true,
      limit: 5000,
      ttl: 86_400_000
    })
  })

  it('parses rates with explicit duration amount', () => {
    expect(parseThrottleRate('50/10s')).toEqual({
      enabled: true,
      limit: 50,
      ttl: 10_000
    })

    expect(parseThrottleRate('120/2m')).toEqual({
      enabled: true,
      limit: 120,
      ttl: 120_000
    })
  })

  it('returns fallback or default when raw is undefined/empty', () => {
    expect(parseThrottleRate(undefined)).toEqual({
      enabled: false,
      limit: 0,
      ttl: 0
    })

    expect(parseThrottleRate(undefined, { enabled: true, limit: 10, ttl: 60_000 })).toEqual({
      enabled: true,
      limit: 10,
      ttl: 60_000
    })
  })

  it('throws on invalid formats', () => {
    expect(() => parseThrottleRate('invalid')).toThrow(/无效的限流表达式/)
    expect(() => parseThrottleRate('100')).toThrow(/无效的限流表达式/)
    expect(() => parseThrottleRate('/m')).toThrow(/无效的限流表达式/)
    expect(() => parseThrottleRate('100/x')).toThrow(/无效的限流表达式/)
  })
})
