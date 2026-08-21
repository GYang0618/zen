import {
  allowedChildTypes,
  canBeChildOf,
  canBeRootOrganization,
  getOrganizationTypeLabel,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_VALUES,
  ROOT_ORGANIZATION_TYPES
} from './organization.hierarchy'

import type { OrganizationTypeValue } from './organization.hierarchy'

export const ORGANIZATION_TYPE_TEMPLATE_IDS = [
  'general',
  'group',
  'division',
  'branch',
  'project'
] as const

export type OrganizationTypeTemplateId = (typeof ORGANIZATION_TYPE_TEMPLATE_IDS)[number]

export const REQUIRED_ORGANIZATION_TYPES = ['company', 'department', 'team'] as const

export type RequiredOrganizationType = (typeof REQUIRED_ORGANIZATION_TYPES)[number]

const REQUIRED_ORGANIZATION_TYPE_SET = new Set<string>(REQUIRED_ORGANIZATION_TYPES)

export const DEFAULT_ORGANIZATION_TYPE_TEMPLATE: OrganizationTypeTemplateId = 'general'

export type OrganizationTypeTemplate = {
  id: OrganizationTypeTemplateId
  name: string
  description: string
  enabledTypes: readonly OrganizationTypeValue[]
}

export const ORGANIZATION_TYPE_TEMPLATES: readonly OrganizationTypeTemplate[] = [
  {
    id: 'general',
    name: '通用企业',
    description: '适合绝大多数公司：公司 → 部门 → 团队。',
    enabledTypes: ['company', 'department', 'team']
  },
  {
    id: 'group',
    name: '集团',
    description: '多法人控股：集团 → 公司 → 部门。',
    enabledTypes: ['group', 'company', 'branch', 'center', 'department', 'team']
  },
  {
    id: 'division',
    name: '事业部制',
    description: '按产品或利润中心切分：公司 → 事业部 → 部门。',
    enabledTypes: ['company', 'division', 'center', 'department', 'team']
  },
  {
    id: 'branch',
    name: '连锁 / 多分支',
    description: '区域或门店经营：公司 → 分支机构 → 部门。',
    enabledTypes: ['company', 'branch', 'department', 'team']
  },
  {
    id: 'project',
    name: '项目型',
    description: '交付与咨询：公司下可同时挂部门与项目组。',
    enabledTypes: ['company', 'department', 'team', 'project']
  }
] as const

export const ORGANIZATION_TYPE_DESCRIPTIONS: Record<OrganizationTypeValue, string> = {
  group: '多法人控股的最上层',
  company: '最常见的经营主体，可作根组织',
  division: '按产品线或利润中心划分',
  branch: '分公司、办事处、门店或工厂',
  center: '研发、共享服务或职能中心',
  department: '通用工作单元，允许嵌套',
  team: '最小常设协作单元',
  project: '可归档的临时交付单元'
}

export type OrganizationTypeCatalogItem = {
  type: OrganizationTypeValue
  label: string
  enabled: boolean
  required: boolean
  canBeRoot: boolean
}

export type OrganizationTypeCatalog = {
  templateId: OrganizationTypeTemplateId | 'custom'
  items: OrganizationTypeCatalogItem[]
}

export type OrganizationTypeCatalogTypeConfig = {
  enabled?: boolean
  label?: string
}

export type OrganizationTypeCatalogConfig = {
  templateId?: OrganizationTypeTemplateId | 'custom'
  types?: Partial<Record<OrganizationTypeValue, OrganizationTypeCatalogTypeConfig>>
}

const TEMPLATE_BY_ID = new Map(
  ORGANIZATION_TYPE_TEMPLATES.map((template) => [template.id, template])
)

const GENERAL_TEMPLATE = TEMPLATE_BY_ID.get('general') as OrganizationTypeTemplate

export function isOrganizationTypeTemplateId(value: string): value is OrganizationTypeTemplateId {
  return TEMPLATE_BY_ID.has(value as OrganizationTypeTemplateId)
}

export function isRequiredOrganizationType(type: string): boolean {
  return REQUIRED_ORGANIZATION_TYPE_SET.has(type)
}

export function getOrganizationTypeTemplate(
  templateId: OrganizationTypeTemplateId
): OrganizationTypeTemplate {
  return TEMPLATE_BY_ID.get(templateId) ?? GENERAL_TEMPLATE
}

function enabledTypesForTemplate(
  templateId: OrganizationTypeTemplateId
): Set<OrganizationTypeValue> {
  return new Set(getOrganizationTypeTemplate(templateId).enabledTypes)
}

export function matchOrganizationTypeTemplateId(
  enabledTypes: readonly string[]
): OrganizationTypeTemplateId | 'custom' {
  const enabled = new Set(enabledTypes)
  for (const template of ORGANIZATION_TYPE_TEMPLATES) {
    if (
      template.enabledTypes.length === enabled.size &&
      template.enabledTypes.every((type) => enabled.has(type))
    ) {
      return template.id
    }
  }
  return 'custom'
}

export function applyOrganizationTypeTemplate(
  templateId: OrganizationTypeTemplateId
): OrganizationTypeCatalogConfig {
  const enabled = enabledTypesForTemplate(templateId)
  const types = Object.fromEntries(
    ORGANIZATION_TYPE_VALUES.map((type) => [
      type,
      {
        enabled: isRequiredOrganizationType(type) || enabled.has(type),
        label: ORGANIZATION_TYPE_LABELS[type]
      }
    ])
  ) as Record<OrganizationTypeValue, OrganizationTypeCatalogTypeConfig>

  return { templateId, types }
}

export function serializeOrganizationTypeCatalog(
  catalog: OrganizationTypeCatalog
): OrganizationTypeCatalogConfig {
  const types = Object.fromEntries(
    catalog.items.map((item) => [item.type, { enabled: item.enabled, label: item.label }])
  ) as Record<OrganizationTypeValue, OrganizationTypeCatalogTypeConfig>

  return {
    templateId: catalog.templateId,
    types
  }
}

function parseTypeConfig(value: unknown): OrganizationTypeCatalogTypeConfig | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const label = typeof record.label === 'string' ? record.label.trim() : undefined
  return {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : undefined,
    label: label || undefined
  }
}

export function parseOrganizationTypeCatalogConfig(
  value: unknown
): OrganizationTypeCatalogConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const templateId =
    typeof record.templateId === 'string' && isOrganizationTypeTemplateId(record.templateId)
      ? record.templateId
      : record.templateId === 'custom'
        ? 'custom'
        : undefined

  const typesRecord =
    record.types && typeof record.types === 'object' && !Array.isArray(record.types)
      ? (record.types as Record<string, unknown>)
      : undefined

  const types = typesRecord
    ? (Object.fromEntries(
        ORGANIZATION_TYPE_VALUES.flatMap((type) => {
          const parsed = parseTypeConfig(typesRecord[type])
          return parsed ? [[type, parsed] as const] : []
        })
      ) as OrganizationTypeCatalogConfig['types'])
    : undefined

  if (!templateId && !types) return null
  return { templateId, types }
}

export function buildOrganizationTypeCatalog(
  config?: OrganizationTypeCatalogConfig | null
): OrganizationTypeCatalog {
  const fallbackTemplateId =
    config?.templateId && isOrganizationTypeTemplateId(config.templateId)
      ? config.templateId
      : DEFAULT_ORGANIZATION_TYPE_TEMPLATE
  const fallbackEnabled = enabledTypesForTemplate(fallbackTemplateId)
  const storedTypes = config?.types ?? {}
  const hasStoredTypes = Object.keys(storedTypes).length > 0

  const items = ORGANIZATION_TYPE_VALUES.map((type) => {
    const stored = storedTypes[type]
    const enabled = isRequiredOrganizationType(type)
      ? true
      : (stored?.enabled ?? (hasStoredTypes ? false : fallbackEnabled.has(type)))
    const label = stored?.label?.trim() || ORGANIZATION_TYPE_LABELS[type]
    return {
      type,
      label,
      enabled,
      required: isRequiredOrganizationType(type),
      canBeRoot: canBeRootOrganization(type)
    }
  })

  return {
    templateId: matchOrganizationTypeTemplateId(
      items.filter((item) => item.enabled).map((item) => item.type)
    ),
    items
  }
}

export function catalogLabelMap(
  catalog: OrganizationTypeCatalog | null | undefined
): Partial<Record<OrganizationTypeValue, string>> | undefined {
  if (!catalog) return undefined
  return Object.fromEntries(catalog.items.map((item) => [item.type, item.label]))
}

export function getCatalogTypeLabel(
  type: string,
  catalog?: OrganizationTypeCatalog | null
): string {
  return getOrganizationTypeLabel(type, catalogLabelMap(catalog))
}

export function isOrganizationTypeEnabled(type: string, catalog: OrganizationTypeCatalog): boolean {
  return catalog.items.some((item) => item.type === type && item.enabled)
}

export function allowedEnabledChildTypes(
  parentType: string,
  catalog: OrganizationTypeCatalog
): OrganizationTypeValue[] {
  return allowedChildTypes(parentType).filter((type) => isOrganizationTypeEnabled(type, catalog))
}

export function enabledRootOrganizationTypes(
  catalog: OrganizationTypeCatalog
): OrganizationTypeValue[] {
  return ROOT_ORGANIZATION_TYPES.filter((type) => isOrganizationTypeEnabled(type, catalog))
}

export function formatCatalogAllowedParentTypeLabels(
  childType: string,
  catalog?: OrganizationTypeCatalog | null
): string {
  const labels = catalogLabelMap(catalog)
  return ORGANIZATION_TYPE_VALUES.filter((parentType) => canBeChildOf(childType, parentType))
    .map((parentType) => getOrganizationTypeLabel(parentType, labels))
    .join('、')
}
