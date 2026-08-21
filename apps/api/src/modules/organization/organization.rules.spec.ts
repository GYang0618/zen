import { BadRequestException } from '@nestjs/common'
import { ROOT_ORGANIZATION_TYPES } from '@zen/shared'

import { assertValidParentType, canBeChildOf } from './organization.rules'

describe('organization hierarchy rules', () => {
  it.each([
    ['company', 'group'],
    ['division', 'group'],
    ['center', 'group'],
    ['department', 'company'],
    ['division', 'company'],
    ['branch', 'company'],
    ['project', 'company'],
    ['department', 'division'],
    ['department', 'branch'],
    ['team', 'branch'],
    ['department', 'center'],
    ['team', 'department'],
    ['department', 'department'],
    ['project', 'department'],
    ['team', 'team'],
    ['team', 'project']
  ] as const)('allows %s below %s', (child, parent) => {
    expect(canBeChildOf(child, parent)).toBe(true)
  })

  it.each([
    ['group', 'company'],
    ['company', 'center'],
    ['company', 'department'],
    ['branch', 'group'],
    ['division', 'team']
  ] as const)('rejects %s below %s', (child, parent) => {
    expect(canBeChildOf(child, parent)).toBe(false)
    expect(() => assertValidParentType(child, parent)).toThrow(BadRequestException)
  })

  it('only allows company and group as new root organization types', () => {
    expect(ROOT_ORGANIZATION_TYPES).toEqual(['company', 'group'])
    expect(() => assertValidParentType('center', null)).toThrow(BadRequestException)
    expect(() => assertValidParentType('team', null)).toThrow(BadRequestException)
    expect(() => assertValidParentType('company', null)).not.toThrow()
    expect(() => assertValidParentType('group', null)).not.toThrow()
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
