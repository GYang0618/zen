import { BadRequestException } from '@nestjs/common'

import { assertValidParentType, canBeChildOf, ROOT_ORGANIZATION_TYPES } from './organization.rules'

describe('organization hierarchy rules', () => {
  it.each([
    ['company', 'group'],
    ['center', 'group'],
    ['branch', 'company'],
    ['center', 'branch'],
    ['department', 'center'],
    ['team', 'department']
  ] as const)('allows %s below %s', (child, parent) => {
    expect(canBeChildOf(child, parent)).toBe(true)
  })

  it.each([
    ['group', 'company'],
    ['company', 'center'],
    ['branch', 'group'],
    ['department', 'company'],
    ['team', 'branch']
  ] as const)('rejects %s below %s', (child, parent) => {
    expect(canBeChildOf(child, parent)).toBe(false)
    expect(() => assertValidParentType(child, parent)).toThrow(BadRequestException)
  })

  it('only allows configured root organization types', () => {
    expect([...ROOT_ORGANIZATION_TYPES]).toEqual(['group', 'company', 'center'])
    expect(() => assertValidParentType('team', null)).toThrow(BadRequestException)
  })

  it('returns stable rejection reasons', () => {
    try {
      assertValidParentType('department', null)
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BadRequestException)
      expect((error as BadRequestException).getResponse()).toMatchObject({
        reason: 'ORG_MOVE_INVALID_ROOT_TYPE'
      })
    }
  })
})
