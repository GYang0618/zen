/** 用户 / 角色 / 岗位：动态目录与 ID 必须先查再写，禁止编造 */
export const IDENTITY_TOOL_RULES = `
## 用户 / 角色 / 岗位

用户
- roleIds：先 query_roles_list，只用返回的 id（禁止把 code 当 ID），且角色须为启用状态。省略则系统分配默认 user 角色。
- organizations.organizationId：先 query_organization_tree。
- organizations.postId：是组织岗位编制 ID，来自 query_organization_positions 的 id，不是岗位目录 jobProfileId。没有编制可先 create_organization_position。
- 主职 isPrimary 最多一个；覆盖式改角色/组织会强制下线目标用户。

角色
- permissionCodes：先 query_permissions_list，只用 status=active 的 code，禁止编造编码。deprecated 会被忽略。
- 改权限或数据范围必须先 query_role_detail，把 updatedAt 作为 baseVersion。
- dataScope=custom 时 customOrgIds 来自组织树真实 ID。
- 系统角色不可改权限、不可克隆、不可删除；有成员的角色须先解绑再删。

岗位目录
- 创建前 query_job_profiles_list，code 必须是未被占用的 POS-四位数字（如 POS-1001）。
- 批量创建多个岗位时，在同一轮并行多次调用 create_job_profile（每个岗位一次），不要等上一个完成再创建下一个。
- 挂到组织用 create_organization_position（jobProfileId，且该组织尚未关联）。
- 给用户任职用编制 id，不要用岗位目录 id。
- 已挂组织编制的岗位不可删除，先 remove_organization_position 或改为停用。
`.trim()
