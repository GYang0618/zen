import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { parseAgentResult } from './parse-agent-result'

const testUserListSchema = z.object({
  items: z.array(z.object({ id: z.string(), username: z.string() })),
  total: z.number()
})

describe('parseAgentResult', () => {
  it('在 inProgress 或 executing 状态下返回未就绪状态', () => {
    const result = parseAgentResult('{"code":200,"data":{}}', { status: 'executing' })
    expect(result.success).toBe(false)
    expect(result.data).toBeUndefined()
    expect(result.message).toBe('正在处理中...')
  })

  it('成功信封且 code=200 时根据 schema 正确解包 data', () => {
    const raw = JSON.stringify({
      code: 200,
      message: 'Success',
      data: {
        items: [{ id: '1', username: 'alice' }],
        total: 1
      }
    })

    const parsed = parseAgentResult(raw, { schema: testUserListSchema })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.code).toBe(200)
      expect(parsed.message).toBe('Success')
      expect(parsed.data.items).toEqual([{ id: '1', username: 'alice' }])
      expect(parsed.data.total).toBe(1)
    }
  })

  it('支持直接传入已解析的对象而非字符串', () => {
    const rawObj = {
      code: 200,
      data: {
        items: [{ id: '2', username: 'bob' }],
        total: 1
      }
    }

    const parsed = parseAgentResult(rawObj, { schema: testUserListSchema })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.items[0]?.username).toBe('bob')
    }
  })

  it('当 code=400 或错误信封时判定为失败并提取错误信息', () => {
    const raw = JSON.stringify({
      code: 400,
      reason: 'BAD_REQUEST',
      message: '用户查询参数无效'
    })

    const parsed = parseAgentResult(raw, { schema: testUserListSchema })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.code).toBe(400)
      expect(parsed.message).toBe('用户查询参数无效')
      expect(parsed.reason).toBe('BAD_REQUEST')
      expect(parsed.data).toBeUndefined()
    }
  })

  it('当 code=200 但返回数据不符合 Zod schema 时拦截并报错', () => {
    const raw = JSON.stringify({
      code: 200,
      data: {
        items: 'invalid-items',
        total: 'not-a-number'
      }
    })

    const parsed = parseAgentResult(raw, { schema: testUserListSchema })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.reason).toBe('SCHEMA_VALIDATION_ERROR')
      expect(parsed.message).toContain('数据校验失败')
      expect(parsed.data).toBeUndefined()
    }
  })

  it('未提供 schema 时直接将解包的 data 视为成功结果', () => {
    const raw = JSON.stringify({
      code: 200,
      data: { customField: 123 }
    })

    const parsed = parseAgentResult<{ customField: number }>(raw)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.customField).toBe(123)
    }
  })
})
