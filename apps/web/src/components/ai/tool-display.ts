/** 对话中只渲染这些工具的结果 UI（表格、属性卡、拾取面板），不渲染「已完成」折叠条。 */
const DEDICATED_RESULT_UI_TOOL_NAMES: ReadonlySet<string> = new Set([
  'indoor_walkthrough',
  'query_job_profiles_list',
  'query_properties',
  'query_users_list'
])

const TOOL_TITLES: Record<string, string> = {
  add_organization_member: '添加组织成员',
  add_role_members: '添加角色成员',
  appearance: '设置外观',
  assign_role_data_scope: '设置角色数据范围',
  assign_role_permissions: '分配角色权限',
  assign_user_roles: '分配用户角色',
  change_organization_parent: '调整组织上级',
  clone_role: '复制角色',
  create_job_profile: '创建岗位',
  create_organization: '创建组织',
  create_organization_position: '创建岗位编制',
  create_role: '创建角色',
  create_user: '创建用户',
  delete_job_profile: '删除岗位',
  delete_roles: '删除角色',
  delete_users: '删除用户',
  hard_delete_users: '彻底删除用户',
  highlight_elements: '高亮构件',
  indoor_walkthrough: '室内漫游',
  load_model: '加载模型',
  navigate_to_page: '跳转页面',
  query_job_profile_detail: '查询岗位详情',
  query_job_profile_list: '查询岗位',
  query_job_profiles_list: '查询岗位目录',
  query_organization_activities: '查询组织动态',
  query_organization_detail: '查询组织详情',
  query_organization_members: '查询组织成员',
  query_organization_positions: '查询岗位编制',
  query_organization_tree: '查询组织架构',
  query_organization_type_catalog: '查询组织类型',
  query_permissions_list: '查询权限列表',
  query_properties: '查询构件属性',
  query_role_detail: '查询角色详情',
  query_role_members: '查询角色成员',
  query_roles_list: '查询角色列表',
  query_route_info: '查询当前路由',
  query_user_detail: '查询用户详情',
  query_user_list: '查询用户',
  query_users_list: '查询用户列表',
  remove_organization_member: '移除组织成员',
  remove_organization_position: '移除岗位编制',
  remove_role_member: '移除角色成员',
  replace_user_organizations: '调整用户组织',
  reset_user_password: '重置用户密码',
  restore_deleted_users: '恢复用户',
  revoke_user_sessions: '注销用户会话',
  unlock_user: '解锁用户',
  update_job_profile_info: '更新岗位',
  update_organization_info: '更新组织',
  update_organization_leader: '更新组织负责人',
  update_organization_position: '更新岗位编制',
  update_organization_type_catalog: '更新组织类型',
  update_role_info: '更新角色',
  update_user_info: '更新用户信息',
  update_user_status: '更新用户状态'
}

const TOOL_NAMES_BY_LENGTH = Object.keys(TOOL_TITLES).sort((a, b) => b.length - a.length)

function isKnownToolName(name: string): boolean {
  return name in TOOL_TITLES
}

function stripQueryPrefix(title: string): string {
  return title.replace(/^查询/, '')
}

export function getToolTitle(name: string): string {
  return TOOL_TITLES[name] ?? name.replaceAll('_', ' ')
}

export function getToolActivityLabel(name: string): string {
  return `正在${getToolTitle(name)}`
}

/** 思考过程对外展示用语：检索/办理，而不是「调用工具」。 */
export function getToolReasoningPhrase(name: string, phase: 'pending' | 'done'): string {
  const title = getToolTitle(name)
  if (phase === 'done') {
    return name.startsWith('query_') ? `${stripQueryPrefix(title)}已就绪` : `${title}已完成`
  }
  return name.startsWith('query_') ? `正在检索${stripQueryPrefix(title)}` : `正在${title}`
}

function replaceToolInvocations(text: string, pattern: RegExp, phase: 'pending' | 'done'): string {
  return text.replace(pattern, (matched, toolName: string) => {
    return isKnownToolName(toolName) ? getToolReasoningPhrase(toolName, phase) : matched
  })
}

/**
 * 将思考文案中的工具调用口吻改写为业务语义，避免把函数名展示给用户。
 * 模型仍可能漏出「需要调用 xxx 工具」；此函数作为展示层兜底。
 */
export function sanitizeReasoningContent(text: string): string {
  if (!text) return text

  const donePattern =
    /(?:我)?已经(?:成功)?(?:调用|使用)(?:了)?\s*[`'「」""']?([a-z][a-z0-9_]*)[`'「」""']?\s*(?:这个|该)?(?:工具|tool)?/gi
  const pendingPattern =
    /(?:我)?(?:需要|将要|准备|打算|先|接下来)?(?:去)?(?:调用|使用)(?:一下)?\s*[`'「」""']?([a-z][a-z0-9_]*)[`'「」""']?\s*(?:这个|该)?(?:工具|tool)?/gi

  let result = replaceToolInvocations(text, donePattern, 'done')
  result = replaceToolInvocations(result, pendingPattern, 'pending')

  for (const name of TOOL_NAMES_BY_LENGTH) {
    result = result.replaceAll(name, getToolTitle(name))
  }

  return result.replace(/[ \t]{2,}/g, ' ')
}

export function hasDedicatedResultUi(name: string | undefined): boolean {
  return Boolean(name && DEDICATED_RESULT_UI_TOOL_NAMES.has(name))
}

/** 内部查证不占用活动文案；写操作与专属 UI 查询会显示「正在…」。 */
export function isSilentLookupTool(name: string | undefined): boolean {
  if (!name) return false
  return name.startsWith('query_') && !hasDedicatedResultUi(name)
}

export function formatActiveToolsLabel(names: string[]): string | undefined {
  const uniqueTitles = [...new Set(names.map(getToolTitle))]
  if (uniqueTitles.length === 0) return undefined
  return `正在${uniqueTitles.join('、')}`
}

/** 有写操作时只提示写操作；仅内部查证时不占用活动文案。 */
export function resolveActivityToolNames(names: string[]): string[] {
  return names.filter((name) => !isSilentLookupTool(name))
}
