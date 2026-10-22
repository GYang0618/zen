/** LangGraph RunnableConfig.configurable 中存放当前用户 JWT 的键名 */
export const ACCESS_TOKEN_CONFIGURABLE_KEY = 'accessToken'

/** 用户明确授权发送给 Qwen 的非敏感长期记忆 */
export const AGENT_MEMORY_CONFIGURABLE_KEY = 'agentMemory'

/** 当前 AG-UI Run ID，供 Tool 幂等键与 Artifact 关联使用。 */
export const AGENT_RUN_ID_CONFIGURABLE_KEY = 'agentRunId'

export const AGENT_APPROVAL_ID_CONFIGURABLE_KEY = 'approvalId'
export const AGENT_TOOL_NAME_CONFIGURABLE_KEY = 'toolName'

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
 * `maxOutputTokensPerModelCall` 同时封顶思维链和正式输出（含 render_a2ui 参数）。
 * 取值对齐 DeepSeek 思考模式的 64K 默认输出，并低于模型上限与整轮 256K 预算，
 * 避免一次生成把整轮额度用完。
 * `timeoutMs` 是无事件空闲超时，有流式事件会续期；人工审批期间不计时。
 */
export const DEFAULT_AGENT_RUN_BUDGET = {
  recursionLimit: 128,
  maxModelCalls: 16,
  maxTotalTokens: 256_000,
  maxFailures: 4,
  maxOutputTokensPerModelCall: 65_536,
  timeoutMs: 180_000,
  maxConcurrentRuns: 3,
  maxMemoriesPerUser: 200,
  maxMemoryContentChars: 8_000
} as const

export const DEFAULT_AGENT_VERSIONS = {
  model: 'deepseek-flash',
  prompt: 'default-agent-prompt-v1',
  toolSchema: 'default-agent-tools-v1'
} as const

/** 全局对话的运行时 agent id。A2UI 只注入这个 agent。 */
export const DEFAULT_AGENT_ID = 'default'

/** 当前模块页面与公共能力的辅助 agent 运行时 id。 */
export const PAGE_AGENT_ID = 'page'

/** 供运行时识别默认 Chat，避免误把页面辅助 Agent 套用默认策略。 */
export const DEFAULT_AGENT_GRAPH_ID = 'default_agent'

/**
 * 早期 `agent_threads.agent_id` 写成了图 id，而不是 {@link DEFAULT_AGENT_ID}。
 * 默认对话列表必须把这两类记录一起查出。
 */
export const LEGACY_DEFAULT_THREAD_AGENT_ID = DEFAULT_AGENT_GRAPH_ID

/** 页面辅助 Agent 的 LangGraph graph id。 */
export const PAGE_AGENT_GRAPH_ID = 'page_agent'

/** 动态 A2UI Surface 工具名（当前） */
export const A2UI_SURFACE_TOOL_NAME = 'render_a2ui' as const

/** 历史会话中可能出现的旧 A2UI 工具名，仅用于识别，不再注册 */
export const LEGACY_A2UI_SURFACE_TOOL_NAMES = ['generate_dynamic_dashboard'] as const

/** 所有应走 A2UI 画布的工具名（含历史兼容） */
export const A2UI_SURFACE_TOOL_NAMES = [
  A2UI_SURFACE_TOOL_NAME,
  ...LEGACY_A2UI_SURFACE_TOOL_NAMES
] as const

/** Agent 工具的中文业务标题映射，供提示词与 UI 展示层单源引用 */
export const TOOL_TITLES: Record<string, string> = {
  add_organization_member: '添加组织成员',
  add_role_members: '添加角色成员',
  appearance: '设置外观',
  assign_role_data_scope: '设置角色数据范围',
  assign_role_permissions: '分配角色权限',
  assign_user_roles: '分配用户角色',
  batch_transfer_organization_members: '批量划转组织成员',
  change_organization_parent: '调整组织上级',
  clone_role: '复制角色',
  collect_new_user_form: '填写新用户表单',
  create_dictionary: '创建字典',
  create_dictionary_workspace: '创建字典空间',
  create_job_profile: '创建岗位',
  create_organization: '创建组织',
  create_organization_position: '创建岗位编制',
  create_role: '创建角色',
  create_user: '创建用户',
  delete_dictionary: '删除字典',
  delete_dictionary_workspace: '删除字典空间',
  delete_job_profile: '删除岗位',
  delete_organization: '删除组织',
  delete_roles: '删除角色',
  delete_users: '删除用户',
  dissolve_organization: '解散组织',
  edit_file: '编辑文件',
  generate_dynamic_dashboard: '生成式界面',
  gis_analyze_deploy_lod: '分析部署LOD',
  gis_analyze_model: '分析三维模型',
  gis_control_roam: '控制场景漫游',
  gis_locate: '场景定位',
  gis_roam: '场景漫游',
  gis_scene_deploy: '场景部署',
  gis_scene_model_catalog: '查看场景模型目录',
  glob: '匹配文件',
  grep: '检索文件内容',
  highlight_elements: '高亮构件',
  indoor_walkthrough: '室内漫游',
  list_demo_notes: '查询便签列表',
  load_model: '加载模型',
  ls: '列出文件',
  merge_organization: '合并组织',
  navigate_to_page: '跳转页面',
  object_properties: '展示构件属性',
  query_agent_model_calls: '查询模型调用',
  query_agent_run_detail: '查询智能体运行详情',
  query_agent_runs: '查询智能体运行',
  query_agent_usage_stats: '统计智能体用量数据',
  query_api_access_logs: '查询访问日志',
  query_api_access_stats: '统计接口访问数据',
  query_audit_logs: '查询操作审计',
  query_audit_overview_stats: '统计审计概览数据',
  query_dictionaries_list: '查询字典列表',
  query_dictionary_detail: '查询字典详情',
  query_dictionary_workspaces: '查询字典空间',
  query_job_profile_detail: '查询岗位详情',
  query_job_profile_list: '查询岗位',
  query_job_profiles_list: '查询岗位目录',
  query_login_audit_stats: '统计登录审计数据',
  query_login_events: '查询登录日志',
  query_operation_audit_stats: '统计操作审计数据',
  query_organization_activities: '查询组织动态',
  query_organization_detail: '查询组织详情',
  query_organization_members: '查询组织成员',
  query_organization_positions: '查询岗位编制',
  query_organization_statistics: '统计组织数据',
  query_organization_tree: '查询组织架构',
  query_organization_type_catalog: '查询组织类型',
  query_organizations_list: '查询组织列表',
  query_permissions_list: '查询权限列表',
  query_post_statistics: '统计岗位数据',
  query_properties: '查询构件属性',
  query_role_detail: '查询角色详情',
  query_role_members: '查询角色成员',
  query_role_statistics: '统计角色数据',
  query_roles_list: '查询角色列表',
  query_route_info: '查询当前路由',
  query_security_audit_stats: '统计安全审计数据',
  query_user_detail: '查询用户详情',
  query_user_list: '查询用户',
  query_user_statistics: '统计用户数据',
  query_users_list: '查询用户列表',
  read_file: '读取文件',
  remove_organization_member: '移除组织成员',
  remove_organization_position: '移除岗位编制',
  remove_role_member: '移除角色成员',
  render_a2ui: '生成式界面',
  replace_user_organizations: '调整用户组织',
  reset_user_password: '重置用户密码',
  restore_deleted_users: '恢复用户',
  revoke_user_sessions: '注销用户会话',
  toggle_dictionary_star: '切换字典收藏',
  unlock_user: '解锁用户',
  update_dictionary_info: '更新字典',
  update_dictionary_workspace: '更新字典空间',
  update_job_profile_info: '更新岗位',
  update_organization_info: '更新组织',
  update_organization_leader: '更新组织负责人',
  update_organization_position: '更新岗位编制',
  update_organization_position_roles: '配置岗位编制角色',
  update_organization_type_catalog: '更新组织类型',
  update_role_info: '更新角色',
  update_user_info: '更新用户信息',
  update_user_status: '更新用户状态',
  write_file: '写入文件'
}
