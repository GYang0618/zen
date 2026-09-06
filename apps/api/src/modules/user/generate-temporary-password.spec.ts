import { userPasswordSchema } from '@zen/shared'

import { generateTemporaryPassword } from './generate-temporary-password.js'

describe('generateTemporaryPassword', () => {
  it('meets the password policy', () => {
    for (let i = 0; i < 40; i += 1) {
      const password = generateTemporaryPassword()
      expect(password).toHaveLength(16)
      expect(userPasswordSchema.safeParse(password).success).toBe(true)
    }
  })

  it('produces distinct values', () => {
    const unique = new Set(Array.from({ length: 20 }, () => generateTemporaryPassword()))
    expect(unique.size).toBeGreaterThan(1)
  })
})
