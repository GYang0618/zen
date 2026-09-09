import {
  ALLOWED_CHILD_TYPES,
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

const hierarchyLines = ORGANIZATION_TYPE_VALUES.map(
  (parent) => `- ${formatType(parent)} → ${formatTypeList(ALLOWED_CHILD_TYPES[parent])}`
).join('\n')

/** 创建/改类型前必须遵守的目录开关与层级规则 */
export const ORGANIZATION_TYPE_CATALOG_RULES = `
## 组织类型目录

创建或修改组织类型前，必须先调用 query_organization_type_catalog，只使用当前 enabled=true 的类型（以接口实时返回为准，切勿凭空假设）。
系统基准必选类型不可关闭：${formatTypeList([...REQUIRED_ORGANIZATION_TYPES])}。

若用户方案所需的类型尚未启用：
1. 组织类型目录属于全租户全局架构配置，仅在用户明确指示需要配置/开启新类型时才可办理。
2. 办理时用刚查到的完整 items 调用 update_organization_type_catalog，将所需类型 enabled 设为 true，其余条目保持原样。
3. 目录更新成功后再办理 create_organization 或修改 type。
4. 严禁在用户未明确授权时擅自篡改租户类型目录。

禁止未查目录就创建。根组织仅限已启用的 ${formatTypeList([...ROOT_ORGANIZATION_TYPES])}。

父子规则（类型仍须已启用）：
${hierarchyLines}
`.trim()
