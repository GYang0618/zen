import { resolveTraceId, TRACE_ID_HEADER } from './trace-id.js'

describe('resolveTraceId', () => {
  it('优先使用 x-trace-id', () => {
    const traceId = resolveTraceId({
      headers: {
        [TRACE_ID_HEADER]: 'trace-from-header'
      }
    })
    expect(traceId).toBe('trace-from-header')
  })

  it('回退到 x-request-id', () => {
    const traceId = resolveTraceId({
      headers: {
        'x-request-id': 'legacy-request-id'
      }
    })
    expect(traceId).toBe('legacy-request-id')
  })

  it('无头时生成 UUID', () => {
    const traceId = resolveTraceId({ headers: {} })
    expect(traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })
})
