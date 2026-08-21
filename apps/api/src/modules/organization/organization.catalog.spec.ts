import {
  applyOrganizationTypeTemplate,
  buildOrganizationTypeCatalog,
  DEFAULT_ORGANIZATION_TYPE_TEMPLATE,
  isOrganizationTypeEnabled,
  matchOrganizationTypeTemplateId,
  parseOrganizationTypeCatalogConfig,
  REQUIRED_ORGANIZATION_TYPES,
  updateOrganizationTypeCatalogSchema
} from '@zen/shared'

describe('organization type catalog', () => {
  it('defaults to the general template when no tenant config exists', () => {
    const catalog = buildOrganizationTypeCatalog(null)
    expect(catalog.templateId).toBe(DEFAULT_ORGANIZATION_TYPE_TEMPLATE)
    expect(catalog.items.filter((item) => item.enabled).map((item) => item.type)).toEqual([
      'company',
      'department',
      'team'
    ])
  })

  it('applies the group template and keeps required types enabled', () => {
    const catalog = buildOrganizationTypeCatalog(applyOrganizationTypeTemplate('group'))
    expect(catalog.templateId).toBe('group')
    expect(isOrganizationTypeEnabled('group', catalog)).toBe(true)
    expect(isOrganizationTypeEnabled('division', catalog)).toBe(false)
    for (const type of REQUIRED_ORGANIZATION_TYPES) {
      expect(isOrganizationTypeEnabled(type, catalog)).toBe(true)
    }
  })

  it('forces required types on even if stored config disables them', () => {
    const catalog = buildOrganizationTypeCatalog({
      types: {
        company: { enabled: false, label: '公司' },
        department: { enabled: true, label: '科室' },
        team: { enabled: true, label: '团队' }
      }
    })
    expect(isOrganizationTypeEnabled('company', catalog)).toBe(true)
    expect(catalog.items.find((item) => item.type === 'department')?.label).toBe('科室')
  })

  it('marks unmatched enable-sets as custom', () => {
    expect(matchOrganizationTypeTemplateId(['company', 'department', 'team', 'project'])).toBe(
      'project'
    )
    expect(matchOrganizationTypeTemplateId(['company', 'department', 'team', 'group'])).toBe(
      'custom'
    )
  })

  it('parses stored tenant settings and ignores unknown fields', () => {
    expect(parseOrganizationTypeCatalogConfig({ extra: true })).toBeNull()
    expect(
      parseOrganizationTypeCatalogConfig({
        templateId: 'branch',
        types: { branch: { enabled: true, label: '门店' } }
      })
    ).toEqual({
      templateId: 'branch',
      types: { branch: { enabled: true, label: '门店' } }
    })
  })

  it('rejects disabling required types in the update contract', () => {
    const items = buildOrganizationTypeCatalog(null).items.map((item) => ({
      type: item.type,
      enabled: item.type === 'company' ? false : item.enabled,
      label: item.label
    }))
    expect(updateOrganizationTypeCatalogSchema.safeParse({ items }).success).toBe(false)
  })
})
