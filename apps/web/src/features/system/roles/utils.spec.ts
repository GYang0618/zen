import { describe, expect, it } from 'vitest'

import { canDeleteRole, getDeletableRoles, getRolesForStatusChange, isProtectedRole } from './utils'

describe('isProtectedRole', () => {
  it('treats system kind as protected', () => {
    expect(isProtectedRole({ isSystem: false, kind: 'system' })).toBe(true)
  })

  it('treats custom roles as mutable', () => {
    expect(isProtectedRole({ isSystem: false, kind: 'custom' })).toBe(false)
  })
})

describe('canDeleteRole', () => {
  it('blocks system roles even without members', () => {
    expect(canDeleteRole({ isSystem: true, kind: 'system', memberCount: 0 })).toBe(false)
  })

  it('blocks custom roles that still have members', () => {
    expect(canDeleteRole({ isSystem: false, kind: 'custom', memberCount: 3 })).toBe(false)
  })

  it('allows deleting an unused custom role', () => {
    expect(canDeleteRole({ isSystem: false, kind: 'custom', memberCount: 0 })).toBe(true)
  })
})

describe('getDeletableRoles', () => {
  it('keeps only unused custom roles', () => {
    const roles = [
      { id: 'sys', isSystem: true, kind: 'system' as const, memberCount: 0 },
      { id: 'used', isSystem: false, kind: 'custom' as const, memberCount: 2 },
      { id: 'ok', isSystem: false, kind: 'custom' as const, memberCount: 0 }
    ]
    expect(getDeletableRoles(roles).map((role) => role.id)).toEqual(['ok'])
  })
})

describe('getRolesForStatusChange', () => {
  it('skips protected roles and ones already in the target status', () => {
    const roles = [
      { id: 'sys', isSystem: true, kind: 'system' as const, status: 'active' as const },
      { id: 'frozen', isSystem: false, kind: 'custom' as const, status: 'disabled' as const },
      { id: 'live', isSystem: false, kind: 'custom' as const, status: 'active' as const }
    ]
    expect(getRolesForStatusChange(roles, 'disabled').map((role) => role.id)).toEqual(['live'])
    expect(getRolesForStatusChange(roles, 'active').map((role) => role.id)).toEqual(['frozen'])
  })

  it('returns an empty list when nothing is eligible', () => {
    const roles = [
      { id: 'sys', isSystem: true, kind: 'system' as const, status: 'active' as const }
    ]
    expect(getRolesForStatusChange(roles, 'disabled')).toEqual([])
  })
})
