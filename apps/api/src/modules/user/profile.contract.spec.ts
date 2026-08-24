import { updateMyProfileSchema } from '@zen/shared'

describe('updateMyProfileSchema birthday', () => {
  it('accepts a date-only birthday', () => {
    expect(updateMyProfileSchema.safeParse({ birthday: '1995-06-15' }).success).toBe(true)
  })

  it('accepts clearing birthday', () => {
    expect(updateMyProfileSchema.safeParse({ birthday: null }).success).toBe(true)
  })

  it('rejects a birthday before 1900', () => {
    expect(updateMyProfileSchema.safeParse({ birthday: '1899-12-31' }).success).toBe(false)
  })

  it('rejects a future birthday', () => {
    expect(updateMyProfileSchema.safeParse({ birthday: '2099-01-01' }).success).toBe(false)
  })

  it('rejects a datetime birthday', () => {
    expect(updateMyProfileSchema.safeParse({ birthday: '1995-06-15T00:00:00.000Z' }).success).toBe(
      false
    )
  })
})
