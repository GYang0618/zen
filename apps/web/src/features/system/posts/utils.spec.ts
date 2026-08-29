import { describe, expect, it } from 'vitest'

import {
  getDeletableJobProfiles,
  getJobProfilesForStatusChange,
  isJobProfileDeletable
} from './utils'

describe('isJobProfileDeletable', () => {
  it('allows deleting a profile with no organization links', () => {
    expect(isJobProfileDeletable({ organizationCount: 0 })).toBe(true)
  })

  it('blocks deleting a profile that still has organization links', () => {
    expect(isJobProfileDeletable({ organizationCount: 2 })).toBe(false)
  })
})

describe('getDeletableJobProfiles', () => {
  it('keeps only profiles without organization links', () => {
    const items = [
      { id: 'a', organizationCount: 0 },
      { id: 'b', organizationCount: 1 },
      { id: 'c', organizationCount: 0 }
    ]
    expect(getDeletableJobProfiles(items).map((item) => item.id)).toEqual(['a', 'c'])
  })
})

describe('getJobProfilesForStatusChange', () => {
  it('skips profiles already in the target status', () => {
    const items = [
      { id: 'a', status: 'active' as const },
      { id: 'b', status: 'disabled' as const },
      { id: 'c', status: 'active' as const }
    ]
    expect(getJobProfilesForStatusChange(items, 'disabled').map((item) => item.id)).toEqual([
      'a',
      'c'
    ])
    expect(getJobProfilesForStatusChange(items, 'active').map((item) => item.id)).toEqual(['b'])
  })

  it('returns an empty list when every profile already matches', () => {
    const items = [{ id: 'a', status: 'active' as const }]
    expect(getJobProfilesForStatusChange(items, 'active')).toEqual([])
  })
})
