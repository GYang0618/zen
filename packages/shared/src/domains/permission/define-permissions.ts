import type {
  PermissionCatalogEntry,
  PermissionCatalogStatus,
  PermissionItemDef
} from './permission.type.js'

export const PERMISSION_CODE_PATTERN = /^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/

const CODE_SEGMENT_PATTERN = /^[a-z][a-z0-9_-]*$/
const KERNEL_NAMESPACE = 'system'

export type KernelPermissionGroup<
  TNamespace extends string = string,
  TResource extends string = string,
  TItems extends readonly PermissionItemDef[] = readonly PermissionItemDef[]
> = {
  entries: PermissionCatalogEntry[]
  codes: {
    readonly [K in TItems[number]['action'] as Uppercase<`${TResource}_${K}`>]: `${TNamespace}:${TResource}:${K}`
  }
}

function assertCodeSegment(value: string, label: string) {
  if (!CODE_SEGMENT_PATTERN.test(value)) {
    throw new Error(`${label} 须匹配 ${CODE_SEGMENT_PATTERN}: ${value}`)
  }
}

function parsePermissionCode(code: string): {
  namespace: string
  resource: string
  action: string
} {
  if (!PERMISSION_CODE_PATTERN.test(code)) {
    throw new Error(`Invalid permission code: ${code}`)
  }
  const [namespace, resource, action] = code.split(':')
  return { namespace, resource, action }
}

function toCodeKey(resource: string, action: string): string {
  return `${resource}_${action}`.toUpperCase().replace(/-/g, '_')
}

/**
 * 按资源声明内核权限。code = `${namespace}:${resource}:${action}`，
 * codes 键为 `${RESOURCE}_${ACTION}`（如 USER_LIST）。
 */
export function defineKernelPermissions<
  const TNamespace extends string,
  const TResource extends string,
  const TItems extends readonly PermissionItemDef[]
>(config: {
  namespace: TNamespace
  resource: TResource
  moduleLabel: string
  items: TItems
}): KernelPermissionGroup<TNamespace, TResource, TItems> {
  assertCodeSegment(config.namespace, 'namespace')
  assertCodeSegment(config.resource, 'resource')
  if (!config.moduleLabel.trim()) {
    throw new Error('moduleLabel 不能为空')
  }

  const codes = {} as Record<string, string>
  const entries: PermissionCatalogEntry[] = config.items.map((item) => {
    assertCodeSegment(item.action, 'action')
    const code = `${config.namespace}:${config.resource}:${item.action}`
    codes[toCodeKey(config.resource, item.action)] = code

    return {
      code,
      name: item.name,
      module: config.moduleLabel,
      resource: config.resource,
      action: item.action,
      description: item.description,
      status: item.status ?? 'active',
      source: 'kernel'
    }
  })

  return {
    entries,
    codes: codes as KernelPermissionGroup<TNamespace, TResource, TItems>['codes']
  }
}

/** 将插件 manifest 贡献转为目录条目（source = plugin:<id>） */
export function createPluginPermissionEntry(input: {
  pluginId: string
  pluginName: string
  code: string
  name: string
  description?: string
  status?: PermissionCatalogStatus
}): PermissionCatalogEntry {
  const { namespace, resource, action } = parsePermissionCode(input.code)
  if (namespace === KERNEL_NAMESPACE) {
    throw new Error(`插件不得贡献内核前缀权限: ${input.code}`)
  }
  if (!input.pluginId.trim()) {
    throw new Error('pluginId 不能为空')
  }
  if (!input.pluginName.trim()) {
    throw new Error('pluginName 不能为空')
  }

  return {
    code: input.code,
    name: input.name,
    module: input.pluginName,
    resource,
    action,
    description: input.description,
    status: input.status ?? 'active',
    source: `plugin:${input.pluginId}`
  }
}

function isPermissionGroup(
  group: { entries: readonly PermissionCatalogEntry[] } | readonly PermissionCatalogEntry[]
): group is { entries: readonly PermissionCatalogEntry[] } {
  return !Array.isArray(group)
}

function collectEntries(
  groups: Array<{ entries: readonly PermissionCatalogEntry[] } | readonly PermissionCatalogEntry[]>
): PermissionCatalogEntry[] {
  return groups.flatMap((group) => (isPermissionGroup(group) ? [...group.entries] : [...group]))
}

function assertUniqueCatalog(entries: readonly PermissionCatalogEntry[]) {
  const seen = new Map<string, PermissionCatalogEntry>()
  for (const entry of entries) {
    if (!PERMISSION_CODE_PATTERN.test(entry.code)) {
      throw new Error(`Invalid permission code: ${entry.code}`)
    }
    const previous = seen.get(entry.code)
    if (!previous) {
      seen.set(entry.code, entry)
      continue
    }
    if (
      previous.name !== entry.name ||
      previous.module !== entry.module ||
      previous.resource !== entry.resource ||
      previous.action !== entry.action ||
      previous.source !== entry.source ||
      previous.status !== entry.status
    ) {
      throw new Error(`权限码冲突且元数据不一致: ${entry.code}`)
    }
    throw new Error(`权限码重复: ${entry.code}`)
  }
}

/** 聚合权限组并校验 code 全局唯一 */
export function definePermissionCatalog(
  groups: Array<{ entries: readonly PermissionCatalogEntry[] } | readonly PermissionCatalogEntry[]>
): PermissionCatalogEntry[] {
  const entries = collectEntries(groups)
  assertUniqueCatalog(entries)
  return entries
}
