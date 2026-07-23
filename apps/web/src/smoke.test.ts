import { describe, expect, it } from 'vitest'

describe('web smoke', () => {
  it('runtime is ready', () => {
    expect(typeof window === 'undefined' || typeof document !== 'undefined').toBe(true)
    expect(1 + 1).toBe(2)
  })
})
