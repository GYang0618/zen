import {
  buildOrganizationTypeCatalog,
  changeOrganizationParentSchema,
  createJobProfileSchema,
  createOrganizationSchema,
  linkOrganizationPositionSchema,
  organizationActivitiesQuerySchema,
  updateOrganizationTypeCatalogSchema
} from '@zen/shared'

describe('organization contracts', () => {
  it('accepts supported organization types', () => {
    const rootTypes = ['group', 'company'] as const
    const childTypes = ['division', 'branch', 'center', 'department', 'team', 'project'] as const

    for (const type of rootTypes) {
      expect(
        createOrganizationSchema.safeParse({
          code: `org_${type}`,
          name: type,
          type,
          parentId: null,
          effectiveDate: '2026-08-13'
        }).success
      ).toBe(true)
    }

    for (const type of childTypes) {
      expect(
        createOrganizationSchema.safeParse({
          code: `org_${type}`,
          name: type,
          type,
          parentId: null,
          effectiveDate: '2026-08-13'
        }).success
      ).toBe(false)
      expect(
        createOrganizationSchema.safeParse({
          code: `org_${type}`,
          name: type,
          type,
          parentId: 'parent-id',
          effectiveDate: '2026-08-13'
        }).success
      ).toBe(true)
    }
  })

  it('rejects sort placement fields from parent changes', () => {
    expect(
      changeOrganizationParentSchema.safeParse({
        parentId: 'parent-id',
        index: 1
      }).success
    ).toBe(false)
  })

  it.each(['POS-0001', 'POS-9999'])('accepts job profile code %s', (code) => {
    expect(
      createJobProfileSchema.safeParse({
        code,
        name: '后端工程师',
        level: 'P7'
      }).success
    ).toBe(true)
  })

  it.each(['pos-0001', 'POS-001', 'POS-00001'])('rejects job profile code %s', (code) => {
    expect(
      createJobProfileSchema.safeParse({
        code,
        name: '后端工程师',
        level: 'P7'
      }).success
    ).toBe(false)
  })

  it('accepts organization position link payload', () => {
    expect(
      linkOrganizationPositionSchema.safeParse({
        jobProfileId: 'profile-1',
        headcount: 2,
        level: 'P7'
      }).success
    ).toBe(true)
  })

  it('applies bounded activity pagination defaults', () => {
    expect(organizationActivitiesQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 })
    expect(organizationActivitiesQuerySchema.safeParse({ page: 1, pageSize: 101 }).success).toBe(
      false
    )
  })

  it('accepts a complete organization type catalog update', () => {
    const items = buildOrganizationTypeCatalog(null).items.map((item) => ({
      type: item.type,
      enabled: item.enabled,
      label: item.label
    }))
    expect(updateOrganizationTypeCatalogSchema.safeParse({ items }).success).toBe(true)
  })
})
