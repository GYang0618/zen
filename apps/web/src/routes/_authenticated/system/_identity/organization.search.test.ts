import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const organizationSearchSchema = z.object({
  view: z.enum(['graph', 'tree']).optional().catch(undefined),
  keyword: z.string().trim().min(1).optional().catch(undefined)
})

describe('organization search schema', () => {
  it('接受 graph/tree 视图并忽略非法值', () => {
    expect(organizationSearchSchema.parse({ view: 'tree' })).toEqual({ view: 'tree' })
    expect(organizationSearchSchema.parse({ view: 'nope' })).toEqual({ view: undefined })
  })

  it('修剪空关键字', () => {
    expect(organizationSearchSchema.parse({ keyword: '  ' })).toEqual({ keyword: undefined })
    expect(organizationSearchSchema.parse({ keyword: '研发' })).toEqual({ keyword: '研发' })
  })
})
