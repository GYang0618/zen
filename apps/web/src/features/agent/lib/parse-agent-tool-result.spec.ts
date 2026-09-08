import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { parseAgentToolResult } from './parse-agent-tool-result'

const userPageSchema = z.object({
  items: z.array(z.object({ id: z.string(), username: z.string() })),
  pagination: z
    .object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number()
    })
    .optional()
})

describe('parseAgentToolResult', () => {
  it('pending 状态不解析 result', () => {
    const parsed = parseAgentToolResult('{"code":200,"data":{}}', { status: 'inProgress' })
    expect(parsed.phase).toBe('pending')
    expect(parsed.success).toBe(false)
    expect(parsed.data).toBeUndefined()
  })

  it('成功信封解出 data', () => {
    const raw = JSON.stringify({
      code: 200,
      message: 'Success',
      data: {
        items: [{ id: 'u1', username: 'alice' }],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 }
      },
      traceId: 'trace-1',
      timestamp: '2026-09-08T06:00:00.000Z'
    })

    const parsed = parseAgentToolResult(raw, { status: 'complete', schema: userPageSchema })
    expect(parsed.phase).toBe('success')
    expect(parsed.success).toBe(true)
    expect(parsed.code).toBe(200)
    expect(parsed.message).toBe('Success')
    expect(parsed.traceId).toBe('trace-1')
    expect(parsed.data?.items).toEqual([{ id: 'u1', username: 'alice' }])
  })

  it('失败信封解出 reason/message', () => {
    const raw = JSON.stringify({
      code: 400,
      reason: 'VALIDATION_ERROR',
      message: '参数错误。请修正后重试。',
      path: '/api/user',
      traceId: 'trace-err',
      timestamp: '2026-09-08T06:00:00.000Z',
      error: null,
      fieldErrors: { keyword: ['过短'] },
      formErrors: null
    })

    const parsed = parseAgentToolResult(raw, { status: 'complete', schema: userPageSchema })
    expect(parsed.phase).toBe('error')
    expect(parsed.success).toBe(false)
    expect(parsed.code).toBe(400)
    expect(parsed.reason).toBe('VALIDATION_ERROR')
    expect(parsed.message).toContain('参数错误')
    expect(parsed.fieldErrors).toEqual({ keyword: ['过短'] })
    expect(parsed.data).toBeUndefined()
  })

  it('非法 JSON / schema 不匹配视为 invalid', () => {
    expect(parseAgentToolResult('not-json', { status: 'complete' }).phase).toBe('invalid')
    expect(
      parseAgentToolResult(
        JSON.stringify({
          code: 200,
          message: 'Success',
          data: { items: 'bad' },
          traceId: 't',
          timestamp: '2026-09-08T06:00:00.000Z'
        }),
        { status: 'complete', schema: userPageSchema }
      ).phase
    ).toBe('invalid')
  })
})
