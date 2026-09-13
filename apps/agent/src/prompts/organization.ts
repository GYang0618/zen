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

## 组织查询与管理准则

组织查询：
- 架构树查询：使用 query_organization_tree；支持传入 keyword（匹配组织名称或编码），返回保留完整祖先链路的组织树。
- 列表查询：使用 query_organizations_list，按名称/编码关键字或组织类型快速分页检索平铺列表。

组织运维与生命周期：
- 单独删除：delete_organization 仅用于无下级、无成员、无岗位的叶子组织。
- 解散向导：当组织包含下级或在职成员时，使用 dissolve_organization，可配置将下级提升/合并到指定部门，并将成员平移至目标组织。
- 合并向导：使用 merge_organization 将源组织及其所有下级、成员整体并入目标组织。
- 跨部门调动：使用 batch_transfer_organization_members 将组织内成员批量划转到目标组织及指定岗位。
- 岗位基准角色（PBAC）：使用 update_organization_position_roles 为组织岗位编制配置基准角色。
`.trim()
