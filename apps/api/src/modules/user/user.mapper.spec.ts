import { toBirthdayDate, toBirthdayString } from './user.mapper.js'

describe('birthday date helpers', () => {
  it('round-trips a date-only birthday through UTC midnight', () => {
    const stored = toBirthdayDate('1995-06-15')
    expect(stored).toEqual(new Date('1995-06-15T00:00:00.000Z'))
    expect(toBirthdayString(stored)).toBe('1995-06-15')
  })

  it('maps null birthday to null', () => {
    expect(toBirthdayDate(null)).toBeNull()
    expect(toBirthdayString(null)).toBeNull()
    expect(toBirthdayString(undefined)).toBeNull()
  })
})
