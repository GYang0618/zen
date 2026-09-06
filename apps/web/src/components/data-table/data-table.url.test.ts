import { describe, expect, it } from 'vitest'

function restoreTableSearch(prev: Record<string, unknown>, next: Record<string, unknown>) {
  return { ...prev, ...next }
}

describe('TanStack Table URL state', () => {
  it('分页、排序、过滤可以写回 search 并恢复', () => {
    const restored = restoreTableSearch(
      { page: 1, keyword: 'alice' },
      { page: 2, sortBy: 'email', sortOrder: 'desc', status: ['ACTIVE'] }
    )
    expect(restored).toEqual({
      page: 2,
      keyword: 'alice',
      sortBy: 'email',
      sortOrder: 'desc',
      status: ['ACTIVE']
    })
  })

  it('空关键字不会覆盖已有过滤', () => {
    const restored = restoreTableSearch({ status: ['ACTIVE'] }, { keyword: undefined })
    expect(restored.status).toEqual(['ACTIVE'])
  })
})
