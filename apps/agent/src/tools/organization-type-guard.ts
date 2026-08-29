export type OrganizationCatalogItem = {
  type: string
  label: string
  enabled: boolean
  required: boolean
  canBeRoot: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCatalogItem(value: unknown): OrganizationCatalogItem | undefined {
  if (!isRecord(value)) return undefined
  if (typeof value.type !== 'string' || typeof value.label !== 'string') return undefined
  if (typeof value.enabled !== 'boolean') return undefined
  return {
    type: value.type,
    label: value.label,
    enabled: value.enabled,
    required: typeof value.required === 'boolean' ? value.required : false,
    canBeRoot: typeof value.canBeRoot === 'boolean' ? value.canBeRoot : false
  }
}

export function parseOrganizationTypeCatalogItems(
  raw: string
): OrganizationCatalogItem[] | undefined {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.catalog) || !Array.isArray(parsed.catalog.items)) {
      return undefined
    }
    const items: OrganizationCatalogItem[] = []
    for (const entry of parsed.catalog.items) {
      const item = parseCatalogItem(entry)
      if (!item) return undefined
      items.push(item)
    }
    return items
  } catch {
    return undefined
  }
}

export function organizationTypeDisabledResult(
  type: string,
  items: OrganizationCatalogItem[]
): string {
  const enabled = items.filter((item) => item.enabled)
  const disabled = items.filter((item) => !item.enabled)
  const format = (item: OrganizationCatalogItem) => `${item.type}（${item.label}）`
  return JSON.stringify({
    success: false,
    reason: 'ORG_TYPE_DISABLED',
    message:
      `组织类型「${type}」未在本企业启用。` +
      `当前已启用：${enabled.map(format).join('、') || '无'}。` +
      `未启用：${disabled.map(format).join('、') || '无'}。` +
      '请先基于 query_organization_type_catalog 返回的完整 items 调用 update_organization_type_catalog，' +
      '将所需类型的 enabled 设为 true，其余保持原样（必选类型不可关闭），然后再重试本工具。'
  })
}

export function isOrganizationTypeDisabledError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('该组织类型未在本企业启用')
}
