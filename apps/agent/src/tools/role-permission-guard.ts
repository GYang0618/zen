function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export type CatalogPermission = {
  code: string
  name: string
  status: string
}

export function parsePermissionCatalog(raw: string): CatalogPermission[] | undefined {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return undefined
    const items: CatalogPermission[] = []
    for (const group of parsed) {
      if (!isRecord(group) || !Array.isArray(group.permissions)) return undefined
      for (const entry of group.permissions) {
        if (!isRecord(entry) || typeof entry.code !== 'string') return undefined
        items.push({
          code: entry.code,
          name: typeof entry.name === 'string' ? entry.name : entry.code,
          status: typeof entry.status === 'string' ? entry.status : 'active'
        })
      }
    }
    return items
  } catch {
    return undefined
  }
}

export function unknownPermissionCodesResult(
  missingCodes: string[],
  catalog: CatalogPermission[]
): string {
  const activeCount = catalog.filter((item) => item.status === 'active').length
  return JSON.stringify({
    success: false,
    reason: 'PERMISSION_CODE_INVALID',
    message:
      `部分权限编码不存在：${missingCodes.join('、')}。` +
      `当前目录共有 ${activeCount} 个可用（active）编码。` +
      '请先 query_permissions_list，只使用 status=active 的 code，不要编造编码后再重试。'
  })
}
