import {
  changeOrganizationParentSchema,
  createOrganizationSchema,
  createPositionSchema,
  organizationActivitiesQuerySchema
} from '@zen/shared'

describe('organization V2 contracts', () => {
  it('accepts all supported organization types', () => {
    const types = ['group', 'company', 'branch', 'center', 'department', 'team'] as const
    for (const type of types) {
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
  })

  it('rejects sort placement fields from parent changes', () => {
    expect(
      changeOrganizationParentSchema.safeParse({
        parentId: 'parent-id',
        index: 1
      }).success
    ).toBe(false)
  })

  it.each(['POS-0001', 'POS-9999'])('accepts position code %s', (code) => {
    expect(
      createPositionSchema.safeParse({
        code,
        name: '后端工程师',
        level: 'P7',
        headcount: 2
      }).success
    ).toBe(true)
  })

  it.each(['pos-0001', 'POS-001', 'POS-00001'])('rejects position code %s', (code) => {
    expect(
      createPositionSchema.safeParse({
        code,
        name: '后端工程师',
        level: 'P7',
        headcount: 2
      }).success
    ).toBe(false)
  })

  it('applies bounded activity pagination defaults', () => {
    expect(organizationActivitiesQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 })
    expect(organizationActivitiesQuerySchema.safeParse({ page: 1, pageSize: 101 }).success).toBe(
      false
    )
  })
})
