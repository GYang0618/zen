import {
  ALLOWED_CHILD_TYPES,
  DEFAULT_ORGANIZATION_TYPE_TEMPLATE,
  getOrganizationTypeTemplate,
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_VALUES,
  REQUIRED_ORGANIZATION_TYPES,
  ROOT_ORGANIZATION_TYPES
} from '@zen/shared'

import type { OrganizationTypeValue } from '@zen/shared'

function formatType(type: OrganizationTypeValue): string {
  return `${type}（${ORGANIZATION_TYPE_LABELS[type]}）`
}

function formatTypeList(types: readonly OrganizationTypeValue[]): string {
  return types.map(formatType).join('、')
}

const defaultTemplate = getOrganizationTypeTemplate(DEFAULT_ORGANIZATION_TYPE_TEMPLATE)
const defaultEnabled = new Set(defaultTemplate.enabledTypes)
const defaultDisabledTypes = ORGANIZATION_TYPE_VALUES.filter((type) => !defaultEnabled.has(type))

const hierarchyLines = ORGANIZATION_TYPE_VALUES.map(
  (parent) => `- ${formatType(parent)} → ${formatTypeList(ALLOWED_CHILD_TYPES[parent])}`
).join('\n')

/** 创建/改类型前必须遵守的目录开关与层级规则 */
export const ORGANIZATION_TYPE_CATALOG_RULES = `
## 组织类型目录

创建或修改组织类型前，必须先调用 query_organization_type_catalog，只使用 enabled=true 的类型。
默认模板「${defaultTemplate.name}」仅启用：${formatTypeList(defaultTemplate.enabledTypes)}。
默认未启用：${formatTypeList(defaultDisabledTypes)}。
必选类型不可关闭：${formatTypeList([...REQUIRED_ORGANIZATION_TYPES])}。

若用户方案需要未启用类型（例如集团、事业部）：
1. 用刚查到的完整 items 调用 update_organization_type_catalog
2. 把所需类型 enabled 设为 true，其余条目保持原样
3. 目录更新成功后再 create_organization / 修改 type

禁止未查目录就创建。根组织仅限已启用的 ${formatTypeList([...ROOT_ORGANIZATION_TYPES])}。

父子规则（类型仍须已启用）：
${hierarchyLines}
`.trim()
