/**
 * 管理组织树的类型目录与父子规则。
 *
 * 本树只表达汇报 / 权限 / 编制挂载，不表达股权或成本中心。
 * 类型 code 稳定；中文标签可在租户侧覆盖（二期）。
 */
export const ORGANIZATION_TYPE_VALUES = [
  'group',
  'company',
  'division',
  'branch',
  'center',
  'department',
  'team',
  'project'
] as const

export type OrganizationTypeValue = (typeof ORGANIZATION_TYPE_VALUES)[number]

/** 新建根节点时允许的类型；存量「中心」根仍可编辑，但不可再新建。 */
export const ROOT_ORGANIZATION_TYPES = ['company', 'group'] as const

export type RootOrganizationTypeValue = (typeof ROOT_ORGANIZATION_TYPES)[number]

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationTypeValue, string> = {
  group: '集团',
  company: '公司',
  division: '事业部',
  branch: '分支机构',
  center: '中心',
  department: '部门',
  team: '团队',
  project: '项目组'
}

/**
 * 子类型白名单。数组顺序即创建表单的默认选项顺序（更常见的类型靠前）。
 */
export const ALLOWED_CHILD_TYPES: Record<OrganizationTypeValue, readonly OrganizationTypeValue[]> =
  {
    group: ['company', 'division', 'center'],
    company: ['department', 'division', 'branch', 'center', 'project'],
    division: ['department', 'center', 'project'],
    branch: ['department', 'team', 'project'],
    center: ['department', 'team', 'project'],
    department: ['team', 'department', 'project'],
    team: ['team'],
    project: ['team']
  }

const ROOT_ORGANIZATION_TYPE_SET = new Set<string>(ROOT_ORGANIZATION_TYPES)

export function isOrganizationType(value: string): value is OrganizationTypeValue {
  return (ORGANIZATION_TYPE_VALUES as readonly string[]).includes(value)
}

export function normalizeOrganizationType(type: string): OrganizationTypeValue | undefined {
  const normalized = type.trim().toLowerCase()
  return isOrganizationType(normalized) ? normalized : undefined
}

/** 是否允许作为新建根节点的类型。 */
export function canBeRootOrganization(type: string): boolean {
  const normalized = normalizeOrganizationType(type)
  return normalized !== undefined && ROOT_ORGANIZATION_TYPE_SET.has(normalized)
}

/** 返回某上级下允许创建的子类型，顺序即表单默认选项。 */
export function allowedChildTypes(parentType: string): OrganizationTypeValue[] {
  const normalized = normalizeOrganizationType(parentType)
  if (!normalized) return []
  return [...ALLOWED_CHILD_TYPES[normalized]]
}

/** 判断 child 能否作为 parent 的直接下级。 */
export function canBeChildOf(childType: string, parentType: string): boolean {
  const child = normalizeOrganizationType(childType)
  if (!child) return false
  return allowedChildTypes(parentType).includes(child)
}

export function getOrganizationTypeLabel(
  type: string,
  customLabels?: Partial<Record<OrganizationTypeValue, string>> | null
): string {
  const normalized = normalizeOrganizationType(type)
  if (!normalized) return type
  const custom = customLabels?.[normalized]?.trim()
  if (custom) return custom
  return ORGANIZATION_TYPE_LABELS[normalized]
}

export function formatAllowedParentTypeLabels(childType: string): string {
  const child = normalizeOrganizationType(childType)
  if (!child) return ''
  return ORGANIZATION_TYPE_VALUES.filter((parentType) => canBeChildOf(child, parentType))
    .map((parentType) => ORGANIZATION_TYPE_LABELS[parentType])
    .join('、')
}
