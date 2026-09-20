// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { useAgentToolResultParse } from './use-agent-tool-result-parse'

const userListSchema = z.object({
  items: z.array(z.object({ id: z.string(), username: z.string() })),
  total: z.number()
})

describe('useAgentToolResultParse', () => {
  it('当 result 为 undefined 或空字符串时保持静默（data 和 error 均为 undefined）', () => {
    const { result: hookResult, rerender } = renderHook(
      ({ result }) => useAgentToolResultParse(result, userListSchema),
      { initialProps: { result: undefined as unknown } }
    )

    expect(hookResult.current.data).toBeUndefined()
    expect(hookResult.current.error).toBeUndefined()

    rerender({ result: '' })
    expect(hookResult.current.data).toBeUndefined()
    expect(hookResult.current.error).toBeUndefined()

    rerender({ result: null })
    expect(hookResult.current.data).toBeUndefined()
    expect(hookResult.current.error).toBeUndefined()
  })

  it('完成时成功解包真实业务数据到 data，且 error 为 undefined', () => {
    const raw = JSON.stringify({
      code: 200,
      message: 'Success',
      data: {
        items: [{ id: 'u1', username: 'alice' }],
        total: 1
      }
    })

    const { result } = renderHook(() => useAgentToolResultParse(raw, userListSchema))

    expect(result.current.error).toBeUndefined()
    expect(result.current.data).toEqual({
      items: [{ id: 'u1', username: 'alice' }],
      total: 1
    })
  })

  it('支持直接传入反序列化后的 JS 对象', () => {
    const rawObj = {
      code: 200,
      data: {
        items: [{ id: 'u2', username: 'bob' }],
        total: 1
      }
    }

    const { result } = renderHook(() => useAgentToolResultParse(rawObj, userListSchema))

    expect(result.current.error).toBeUndefined()
    expect(result.current.data?.items[0]?.username).toBe('bob')
  })

  it('当 code=400 或错误信封时将错误信息提取到 error，data 为 undefined', () => {
    const raw = JSON.stringify({
      code: 400,
      reason: 'INVALID_QUERY',
      message: '组织 ID 不存在'
    })

    const { result } = renderHook(() => useAgentToolResultParse(raw, userListSchema))

    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBe('组织 ID 不存在')
  })

  it('当数据不符合 Zod schema 时将校验错误提取到 error，data 为 undefined', () => {
    const raw = JSON.stringify({
      code: 200,
      data: {
        items: 'invalid-array',
        total: 'bad'
      }
    })

    const { result } = renderHook(() => useAgentToolResultParse(raw, userListSchema))

    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toContain('数据校验失败')
  })
})
