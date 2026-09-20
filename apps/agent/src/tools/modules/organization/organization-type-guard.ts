import { toErrorEnvelope, unwrapToolSuccessData } from '../../../api/tool-result'

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
  const data = unwrapToolSuccessData(raw)
  if (!isRecord(data) || !isRecord(data.catalog) || !Array.isArray(data.catalog.items)) {
    return undefined
  }
  const items: OrganizationCatalogItem[] = []
  for (const entry of data.catalog.items) {
    const item = parseCatalogItem(entry)
    if (!item) return undefined
    items.push(item)
  }
  return items
}

export function organizationTypeDisabledResult(
  type: string,
  items: OrganizationCatalogItem[]
): string {
  const enabled = items.filter((item) => item.enabled)
  const disabled = items.filter((item) => !item.enabled)
  const format = (item: OrganizationCatalogItem) => `${item.type}（${item.label}）`
  return JSON.stringify(
    toErrorEnvelope({
      code: 400,
      reason: 'ORG_TYPE_DISABLED',
      message:
        `组织类型「${type}」未在本企业启用。` +
        `当前已启用：${enabled.map(format).join('、') || '无'}。` +
        `未启用：${disabled.map(format).join('、') || '无'}。` +
        '请先在组织类型目录中启用所需类型后再重试。'
    })
  )
}

export function isOrganizationTypeDisabledError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('该组织类型未在本企业启用')
}
