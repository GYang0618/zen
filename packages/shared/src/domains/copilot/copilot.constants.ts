/** LangGraph RunnableConfig.configurable 中存放当前用户 JWT 的键名 */
export const ACCESS_TOKEN_CONFIGURABLE_KEY = 'accessToken'

/** 用户明确授权发送给 Qwen 的非敏感长期记忆 */
export const AGENT_MEMORY_CONFIGURABLE_KEY = 'agentMemory'

/** 当前 AG-UI Run ID，供 Tool 幂等键与 Artifact 关联使用。 */
export const AGENT_RUN_ID_CONFIGURABLE_KEY = 'agentRunId'

/** HITL 通过后注入给 Default Agent 的短期二次确认令牌。 */
export const AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY = 'stepUpToken'
export const AGENT_APPROVAL_ID_CONFIGURABLE_KEY = 'approvalId'
export const AGENT_TOOL_NAME_CONFIGURABLE_KEY = 'toolName'

/** 对话审批通过后，与页面 step-up 令牌同等有效的时间窗。 */
export const AGENT_HITL_STEP_UP_WINDOW_MS = 3 * 60 * 1_000

/** 当前租户允许 Default Agent 暴露 Tool 的 ACTIVE 插件 ID。 */
export const ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY = 'activeAgentPlugins'

export const AGENT_TENANT_ID_CONFIGURABLE_KEY = 'tenantId'
export const AGENT_USER_ID_CONFIGURABLE_KEY = 'userId'
export const AGENT_THREAD_ID_CONFIGURABLE_KEY = 'threadId'
export const AGENT_TRACE_ID_CONFIGURABLE_KEY = 'traceId'
export const AGENT_LOCALE_CONFIGURABLE_KEY = 'locale'
export const AGENT_PERMISSIONS_CONFIGURABLE_KEY = 'permissions'
export const AGENT_MODEL_METADATA_CONFIGURABLE_KEY = 'modelMetadata'

/**
 * Default Agent 的运行预算。远程 LangGraph 使用 snake_case 的 recursion_limit。
 *
 * `recursionLimit` 计的是 Pregel 节点访问，不是模型调用次数。当前图每轮约 7 个节点
 *（2×before_model + model_request + 3×after_model + tools），首轮另有 before_agent。
 * 按 maxModelCalls 估算：8 + 7×(maxModelCalls-1) ≈ 113，取 128。
 * `maxTotalTokens` 是整轮累计用量，不是单次上下文窗口。
 * `timeoutMs` 是无事件空闲超时，有流式事件会续期；人工审批期间不计时。
 */
export const DEFAULT_AGENT_RUN_BUDGET = {
  recursionLimit: 128,
  maxModelCalls: 16,
  maxTotalTokens: 256_000,
  maxFailures: 4,
  maxOutputTokensPerModelCall: 4096,
  timeoutMs: 180_000,
  maxConcurrentRuns: 3,
  maxMemoriesPerUser: 200,
  maxMemoryContentChars: 8_000
} as const

export const DEFAULT_AGENT_VERSIONS = {
  model: 'qwen3.7-max-2026-06-08',
  prompt: 'default-agent-prompt-v1',
  toolSchema: 'default-agent-tools-v1'
} as const

/** 供运行时识别默认 Chat，避免误把 Popup 的 plan Agent 套用默认策略。 */
export const DEFAULT_AGENT_GRAPH_ID = 'default_agent'

/** 拥有前端专用渲染 UI（表格、3D/属性卡片等）的工具名单，提示词与展示层单源引用 */
export const DEDICATED_RESULT_UI_TOOL_NAMES = [
  'generate_dynamic_dashboard',
  'indoor_walkthrough',
  'query_job_profiles_list',
  'query_properties',
  'query_users_list'
] as const

export type DedicatedResultUiToolName = (typeof DEDICATED_RESULT_UI_TOOL_NAMES)[number]

/** Agent 工具的中文业务标题映射，供提示词与 UI 展示层单源引用 */
export const TOOL_TITLES: Record<string, string> = {
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
  generate_dynamic_dashboard: '生成动态看板',
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
