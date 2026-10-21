/**
 * API 路由与业务中文标题映射表
 */
export const API_ROUTE_TITLES: Record<string, string> = {
  // 认证
  'POST /auth/login': '登录了系统',
  'POST /auth/logout': '退出了登录',
  'POST /auth/refresh': '刷新了令牌',
  'POST /auth/mfa/generate': '请求了双因子密钥',
  'POST /auth/mfa/enable': '开启了双因子认证',
  'POST /auth/mfa/disable': '关闭了双因子认证',
  'POST /auth/mfa/verify': '验证了双因子认证',
  'POST /auth/change-password': '修改了密码',
  'POST /auth/forgot-password': '请求了重置密码',
  'POST /auth/reset-password': '重置了密码',

  // 用户
  'GET /users': '访问了用户列表',
  'POST /users': '创建了用户',
  'GET /users/me': '查看了个人资料',
  'PATCH /users/me': '更新了个人资料',
  'GET /users/statistics': '查看了用户统计',
  'GET /users/:id': '查看了用户详情',
  'PATCH /users/:id': '更新了用户信息',
  'DELETE /users': '删除了用户',
  'DELETE /users/hard': '彻底删除了用户',
  'PATCH /users/:id/restore': '恢复了用户',
  'PATCH /users/:id/status': '变更了用户状态',
  'PUT /users/:id/roles': '调整了用户角色',
  'PUT /users/:id/organizations': '调整了用户组织',
  'POST /users/:id/unlock': '解锁了用户账号',
  'POST /users/:id/reset-password': '重置了用户密码',
  'POST /users/:id/revoke-sessions': '强制下线了用户会话',
  'POST /users/:id/reveal': '查看了用户敏感信息',

  // 角色
  'GET /role': '访问了角色列表',
  'POST /role': '创建了角色',
  'GET /role/:id': '查看了角色详情',
  'PATCH /role/:id': '更新了角色信息',
  'DELETE /role/:id': '删除了角色',
  'POST /role/:id/clone': '克隆了角色',
  'PUT /role/:id/status': '变更了角色状态',
  'PUT /role/:id/permissions': '分配了角色权限',
  'PUT /role/:id/data-scope': '调整了角色数据范围',
  'GET /role/:id/members': '查看了角色成员',
  'POST /role/:id/members': '添加了角色成员',
  'DELETE /role/:id/members': '移除了角色成员',

  // 组织
  'GET /organizations': '访问了组织列表',
  'POST /organizations': '创建了组织',
  'GET /organizations/tree': '访问了组织架构树',
  'GET /organizations/:id': '查看了组织详情',
  'PATCH /organizations/:id': '更新了组织信息',
  'DELETE /organizations/:id': '删除了组织',
  'GET /organizations/:id/activities': '查看了组织动态',
  'PUT /organizations/:id/leader': '变更了组织负责人',
  'PUT /organizations/:id/parent': '变更了上级组织',
  'POST /organizations/:id/members': '添加了组织成员',
  'DELETE /organizations/:id/members': '移除了组织成员',
  'POST /organizations/members/transfer': '调整了组织成员归属',
  'POST /organizations/merge': '合并了组织',
  'POST /organizations/:id/dissolve': '解散了组织',
  'GET /organizations/:id/positions': '查看了组织岗位',
  'POST /organizations/:id/positions': '增设了组织岗位',
  'PATCH /organizations/:id/positions/:positionId': '更新了组织岗位',
  'DELETE /organizations/:id/positions/:positionId': '裁撤了组织岗位',
  'PATCH /organizations/type-catalog': '调整了组织类型目录',

  // 岗位
  'GET /posts': '访问了岗位列表',
  'POST /posts': '创建了岗位',
  'GET /posts/:id': '查看了岗位详情',
  'PATCH /posts/:id': '更新了岗位信息',
  'DELETE /posts/:id': '删除了岗位',

  // 数据字典 v2
  'GET /dictionary/folders': '访问了字典目录列表',
  'POST /dictionary/folders': '创建了字典目录',
  'PATCH /dictionary/folders/:id': '更新了字典目录',
  'DELETE /dictionary/folders/:id': '删除了字典目录',
  'GET /dictionary/dictionaries': '访问了字典列表',
  'POST /dictionary/dictionaries': '创建了字典',
  'PATCH /dictionary/dictionaries/:id': '更新了字典',
  'DELETE /dictionary/dictionaries/:id': '删除了字典',
  'GET /dictionary/dictionaries/:id/options': '访问了字典选项',
  'POST /dictionary/dictionaries/:id/options': '创建了字典选项',
  'PATCH /dictionary/options/:id': '更新了字典选项',
  'DELETE /dictionary/options/:id': '删除了字典选项',
  'PATCH /dictionary/dictionaries/:id/options/order': '调整了字典选项顺序',

  // 插件
  'GET /plugins': '访问了插件列表',
  'POST /plugins/:id/activate': '启用了插件',
  'POST /plugins/:id/deactivate': '停用了插件',
  'PATCH /plugins/:id/config': '更新了插件配置',

  // 存储
  'GET /storage/files': '访问了文件列表',
  'POST /storage/files': '上传了文件',
  'GET /storage/files/:id/url': '获取了文件下载地址',
  'DELETE /storage/files/:id': '删除了文件',

  // 审计
  'GET /audit': '查看了操作审计日志',
  'GET /audit/login-events': '查看了系统登录历史',
  'GET /audit/access': '查看了接口访问日志',
  'GET /audit/access/stats': '查看了接口访问统计',
  'GET /audit/agent/stats': '查看了 AI 用量统计',
  'GET /audit/agent/runs': '查看了 AI 运行记录',
  'GET /audit/agent/runs/:runId': '查看了 AI 运行详情',

  // AI 配额与模型价格
  'GET /ai-quotas': '查看了 AI 配额列表',
  'PUT /ai-quotas': '配置了 AI 配额',
  'GET /ai-model-prices': '查看了模型价格版本',
  'POST /ai-model-prices': '发布了模型价格版本',

  // Copilot Runtime
  'POST /copilot/runtime/usage': '上报了 Agent 模型用量',
  'POST /copilot/runtime/approvals/:id/decision': '裁决了 Agent 审批单'
}

const CUID_OR_UUID_SEGMENT = /^[a-z0-9]{20,36}$/i
const NUMBER_SEGMENT = /^\d+$/

/**
 * 将路径中的动态 ID 段规格化为 :id
 */
export function normalizeRoutePath(path: string): string {
  const segments = path.split('/').map((seg) => {
    if (!seg) return seg
    if (CUID_OR_UUID_SEGMENT.test(seg) || NUMBER_SEGMENT.test(seg)) {
      return ':id'
    }
    return seg
  })
  return segments.join('/')
}

/**
 * 解析路由操作标题（三级回退）
 */
export function resolveRouteTitle(
  method: string,
  route: string,
  swaggerSummary?: string | null
): string {
  const upperMethod = method.toUpperCase()
  const normalized = normalizeRoutePath(route)
  const key = `${upperMethod} ${normalized}`

  // 1. 注册表匹配
  if (API_ROUTE_TITLES[key]) {
    return API_ROUTE_TITLES[key]
  }

  // 2. Swagger Operation Summary
  if (swaggerSummary?.trim()) {
    return `调用了「${swaggerSummary.trim()}」`
  }

  // 3. 兜底
  return `调用了 ${upperMethod} ${normalized}`
}
