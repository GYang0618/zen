import {
  approvalDecisionSchema,
  eventListQuerySchema,
  memoryUpsertSchema,
  threadListQuerySchema,
  threadUpdateSchema
} from './default-agent-runtime.schemas.js'

describe('Default Agent runtime HTTP schemas', () => {
  it('将事件查询参数转换为有界数字', () => {
    expect(eventListQuerySchema.parse({ after: '3', limit: '1000' })).toEqual({
      after: 3,
      limit: 1000
    })
    expect(eventListQuerySchema.safeParse({ limit: '1001' }).success).toBe(false)
  })

  it('会话列表支持可选游标分页参数', () => {
    expect(threadListQuerySchema.parse({})).toEqual({ limit: 30 })
    expect(
      threadListQuerySchema.parse({
        limit: '20',
        cursor: '2026-09-03T10:00:00.000Z::thread-1'
      })
    ).toEqual({
      limit: 20,
      cursor: '2026-09-03T10:00:00.000Z::thread-1'
    })
    expect(threadListQuerySchema.safeParse({ limit: '101' }).success).toBe(false)
  })

  it('拒绝空更新和非法审批决策', () => {
    expect(threadUpdateSchema.safeParse({}).success).toBe(false)
    expect(approvalDecisionSchema.safeParse({ decision: 'skip' }).success).toBe(false)
  })

  it('仅允许显式的 Qwen 记忆授权字段', () => {
    expect(
      memoryUpsertSchema.safeParse({
        scope: 'user',
        kind: 'preference',
        key: 'language',
        content: { value: 'zh-CN' },
        sensitivity: 'non_sensitive',
        shareWithModel: true,
        modelProvider: 'qwen'
      }).success
    ).toBe(true)
    expect(
      memoryUpsertSchema.safeParse({
        scope: 'user',
        kind: 'preference',
        key: 'language',
        content: {},
        modelProvider: 'openai'
      }).success
    ).toBe(false)
  })
})
