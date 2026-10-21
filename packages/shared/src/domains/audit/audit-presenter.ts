import type {
  AuditDiff,
  AuditDiffChange,
  AuditDiffFilter,
  AuditDiffPermission
} from './audit-diff.schema.js'

export type AuditTitleEntry = {
  title: string
  fallback: string
}

/** action → 简要标题注册表。新增 action 必须在此登记。 */
export const AUDIT_ACTION_LABELS: Record<string, AuditTitleEntry> = {
  // 角色
  'system.role.created': { title: '创建了角色', fallback: '创建了角色' },
  'system.role.updated': { title: '更新了信息', fallback: '更新了角色信息' },
  'system.role.unfrozen': { title: '启用了角色', fallback: '启用了角色' },
  'system.role.frozen': { title: '停用了角色', fallback: '停用了角色' },
  'system.role.data_scope_updated': { title: '调整了数据范围', fallback: '调整了角色数据范围' },
  'system.role.cloned': { title: '克隆了角色', fallback: '克隆了角色' },
  'system.role.members_added': { title: '添加了成员', fallback: '添加了角色成员' },
  'system.role.member_removed': { title: '移除了成员', fallback: '移除了角色成员' },
  'system.role.permissions_assigned': { title: '更新了权限', fallback: '更新了角色权限' },
  'system.role.deleted': { title: '删除了角色', fallback: '删除了角色' },

  // 组织
  'system.organization.created': { title: '创建了组织', fallback: '创建了组织' },
  'system.organization.deleted': { title: '删除了组织', fallback: '删除了组织' },
  'system.organization.updated': { title: '更新了信息', fallback: '更新了组织信息' },
  'system.organization.leader_updated': { title: '变更了负责人', fallback: '变更了组织负责人' },
  'system.organization.parent_changed': { title: '调整了上级', fallback: '调整了组织上级架构' },
  'system.organization.members_added': { title: '添加了成员', fallback: '添加了组织成员' },
  'system.organization.members_transferred_out': {
    title: '调出了成员',
    fallback: '调出了组织成员'
  },
  'system.organization.members_transferred_in': { title: '调入了成员', fallback: '调入了组织成员' },
  'system.organization.members_removed': { title: '移除了成员', fallback: '移除了组织成员' },
  'system.organization.member_added': { title: '添加了成员', fallback: '添加了组织成员' },
  'system.organization.member_removed': { title: '移除了成员', fallback: '移除了组织成员' },
  'system.organization.position_created': { title: '增设了岗位', fallback: '增设了组织岗位' },
  'system.organization.position_updated': { title: '更新了岗位', fallback: '更新了组织岗位' },
  'system.organization.position_removed': { title: '裁撤了岗位', fallback: '裁撤了组织岗位' },
  'system.organization.merged': { title: '合并了组织', fallback: '合并了组织' },
  'system.organization.merged_in': { title: '并入了组织', fallback: '并入了组织' },
  'system.organization.dissolved': { title: '解散了组织', fallback: '解散了组织' },
  'system.organization.type_catalog_updated': {
    title: '调整了组织类型',
    fallback: '调整了组织类型目录'
  },

  // 用户
  'system.user.created': { title: '创建了用户', fallback: '创建了用户' },
  'system.user.updated': { title: '更新了信息', fallback: '更新了用户信息' },
  'system.user.deleted': { title: '删除了用户', fallback: '删除了用户（可恢复）' },
  'system.user.purged': { title: '彻底删除了用户', fallback: '彻底删除了用户，不可恢复' },
  'system.user.restored': { title: '恢复了用户', fallback: '恢复了已删除用户' },
  'system.user.status_changed': { title: '变更了用户状态', fallback: '变更了用户状态' },
  'system.user.enabled': { title: '启用了用户', fallback: '启用了用户' },
  'system.user.disabled': { title: '停用了用户', fallback: '停用了用户' },
  'system.user.roles_assigned': { title: '调整了角色', fallback: '调整了用户角色归属' },
  'system.user.organizations_assigned': { title: '调整了组织部门', fallback: '调整了用户组织归属' },
  'system.user.unlocked': { title: '解锁了账号', fallback: '解锁了用户账号' },
  'system.user.password_reset': { title: '重置了密码', fallback: '重置了用户登录密码' },
  'system.user.sessions_revoked': { title: '下线了会话', fallback: '强制下线了用户所有会话' },
  'system.user.primary_role_updated': { title: '调整了主角色', fallback: '调整了用户主角色' },
  'system.user.organizations_replaced': {
    title: '调整了组织部门',
    fallback: '调整了用户组织归属'
  },
  'system.user.exported': { title: '导出了用户', fallback: '导出了用户列表' },
  'system.user.sensitive_viewed': { title: '查看了敏感信息', fallback: '查看了用户敏感信息' },

  // 岗位
  'system.post.created': { title: '创建了岗位', fallback: '创建了岗位' },
  'system.post.updated': { title: '更新了信息', fallback: '更新了岗位信息' },
  'system.post.deleted': { title: '删除了岗位', fallback: '删除了岗位' },

  // 字典
  'system.dict.type_created': { title: '创建了字典类型', fallback: '创建了字典类型' },
  'system.dict.type_updated': { title: '更新了字典类型', fallback: '更新了字典类型' },
  'system.dict.type_deleted': { title: '删除了字典类型', fallback: '删除了字典类型' },
  'system.dict.item_created': { title: '新增了字典项', fallback: '新增了字典项' },
  'system.dict.item_updated': { title: '更新了字典项', fallback: '更新了字典项' },
  'system.dict.item_deleted': { title: '删除了字典项', fallback: '删除了字典项' },

  // 插件
  'system.plugin.activated': { title: '启用了插件', fallback: '启用了插件' },
  'system.plugin.deactivated': { title: '停用了插件', fallback: '停用了插件' },
  'system.plugin.config_updated': { title: '更新了插件配置', fallback: '更新了插件配置' },

  // 存储文件
  'storage.file.uploaded': { title: '上传了文件', fallback: '上传了文件' },
  'storage.file.deleted': { title: '删除了文件', fallback: '删除了文件' },
  'storage.file.preview_url': { title: '预览了文件', fallback: '获取了文件预览地址' },
  'storage.file.download_url': { title: '获取了下载地址', fallback: '获取了文件临时下载地址' },
  'storage.file.delete': { title: '删除了文件', fallback: '删除了文件' },
  'storage.file.restore': { title: '恢复了文件', fallback: '恢复了文件' },
  'storage.file.purge': { title: '彻底删除了文件', fallback: '彻底删除了文件，不可恢复' },
  'storage.upload.intent': { title: '发起了文件上传', fallback: '发起了文件上传' },
  'storage.upload.complete': { title: '完成了文件上传', fallback: '完成了文件上传' },
  'storage.upload.deduplicated': { title: '复用了已有文件', fallback: '上传内容与已有文件重复' },

  // 认证
  'auth.login.success': { title: '登录了系统', fallback: '登录了系统' },
  'auth.login.failed': { title: '登录失败', fallback: '账号或密码错误' },
  'auth.login.locked': { title: '账号被锁定', fallback: '登录失败次数过多导致锁定' },
  'auth.logout': { title: '退出了登录', fallback: '注销了当前会话' },
  'auth.token.refreshed': { title: '刷新了令牌', fallback: '刷新了访问令牌' },
  'auth.token.reuse_detected': {
    title: '检测到令牌复用',
    fallback: '已吊销令牌被再次使用，强制下线'
  },
  'auth.mfa.enabled': { title: '开启了双因子认证', fallback: '开启了双因子认证' },
  'auth.mfa.disabled': { title: '关闭了双因子认证', fallback: '关闭了双因子认证' },
  'auth.password.changed': { title: '修改了密码', fallback: '修改了密码' },
  'auth.password.reset': { title: '重置了密码', fallback: '通过重置流程设置了新密码' },
  'auth.profile.updated': { title: '更新了个人资料', fallback: '更新了个人资料' },

  // 安全与合规
  'security.access.denied': { title: '越权访问被拒绝', fallback: '访问被拒绝' },
  'security.rate_limited': { title: '触发了限流', fallback: '请求过于频繁' },
  'system.audit.exported': { title: '导出了审计日志', fallback: '导出了操作或访问审计日志' },

  // Agent 与 AI 用量
  'agent.tool.invoked': { title: '调用了工具', fallback: 'AI 助手调用了工具' },
  'agent.approval.approved': { title: '批准了 AI 操作', fallback: '批准了 AI 助手的高危操作' },
  'agent.approval.rejected': { title: '拒绝了 AI 操作', fallback: '拒绝了 AI 助手的高危操作' },
  'agent.run.failed': { title: 'AI 任务失败', fallback: '模型调用或任务执行异常' },
  'agent.run.budget_exceeded': {
    title: '超出了单次预算',
    fallback: '累计 Token 超过单次运行预算上限'
  },
  'agent.run.large_usage': { title: '产生了大额消耗', fallback: '单次任务消耗超出高额预警阈值' },
  'agent.quota.warned': { title: '接近 AI 配额', fallback: '本周期 AI 用量达到软上限预警线' },
  'agent.quota.exceeded': {
    title: '超出了 token 配额',
    fallback: '本周期 AI 用量达到硬上限并拒绝新对话'
  },
  'system.ai_quota.updated': { title: '修改了 AI 配额', fallback: '更新了租户或主体 AI 配额' },
  'system.ai_model.switched': { title: '切换了模型', fallback: '切换了默认或备选模型版本' },
  'system.ai_price.created': { title: '调整了模型价格', fallback: '新增或调整了 AI 模型单价版本' },
  'system.agent.content_viewed': {
    title: '查看了 AI 对话内容',
    fallback: '审计员调阅了 AI 完整交互消息'
  }
}

/** 前缀兜底规则：system.<resource>.* 回退 */
const RESOURCE_FALLBACK: Record<string, string> = {
  user: '操作了用户',
  role: '操作了角色',
  organization: '操作了组织',
  post: '操作了岗位',
  dict: '操作了字典',
  plugin: '操作了插件',
  file: '操作了文件',
  audit: '操作了审计',
  auth: '执行了认证操作',
  agent: 'AI 助手执行了操作',
  security: '触发了安全策略'
}

export type AuditPresentationSection = {
  members?: { kind: 'added' | 'removed'; names: string[]; verb: string }
  permissions?: { kind: 'added' | 'removed'; permissions: AuditDiffPermission[] }[]
  filters?: AuditDiffFilter[]
}

export type AuditPresentation = {
  title: string
  description: string | null
  sections?: AuditPresentationSection
}

function displayText(value: string | null | undefined): string {
  if (value == null || value === '') return '空'
  return value
}

export function formatChanges(changes: AuditDiffChange[]): string {
  if (changes.length === 0) return '无字段变更'
  return changes
    .map((c) => `${c.label}由「${displayText(c.from)}」更新为「${displayText(c.to)}」`)
    .join('、')
}

export function formatMembersLine(names: string[], verb: string, previewLimit = 5): string {
  if (names.length === 0) return `${verb} 0 人`
  if (names.length <= previewLimit) {
    return `${verb}${names.join('、')} 共 ${names.length} 人`
  }
  const preview = names.slice(0, previewLimit)
  return `${verb}${preview.join('、')} 等 ${names.length} 人`
}

export function groupPermissionLabels(items: AuditDiffPermission[]): string[] {
  const groups = new Map<string, string[]>()
  for (const item of items) {
    const moduleName = item.module || '其他'
    const current = groups.get(moduleName) ?? []
    current.push(item.name)
    groups.set(moduleName, current)
  }
  return Array.from(groups.entries()).map(
    ([moduleName, names]) => `${moduleName}（${names.join('、')}）`
  )
}

export function formatPermissionSectionsText(
  sections: { kind: 'added' | 'removed'; permissions: AuditDiffPermission[] }[]
): string {
  if (sections.length === 0) return '无权限变更'
  return sections
    .map((section) => {
      const title = section.kind === 'added' ? '新增' : '移除'
      const lines = groupPermissionLabels(section.permissions)
      return [title, ...lines].join('；')
    })
    .join('\n')
}

/** 通用描述解析器 */
export function describeAudit(action: string, diff: AuditDiff | null): AuditPresentation {
  const entry = AUDIT_ACTION_LABELS[action]
  const resourceKey = action.split('.')[1] ?? ''
  const title = entry?.title ?? RESOURCE_FALLBACK[resourceKey] ?? '执行了操作'

  if (!diff) {
    return { title, description: entry?.fallback ?? null }
  }

  // 1. 越权拒绝
  if (diff.denied) {
    const attempted = diff.denied.attempted
    const targetName = diff.denied.subject?.name ? `「${diff.denied.subject.name}」` : ''
    const perms = diff.denied.missing.map((p) => `${p.name}（${p.code}）`).join('、')
    return {
      title,
      description: `尝试${attempted}${targetName}，缺少权限：${perms}`
    }
  }

  // 2. 字段修改
  if (diff.changes && diff.changes.length > 0) {
    return {
      title,
      description: formatChanges(diff.changes)
    }
  }

  // 3. 成员增删
  if (diff.members?.added && diff.members.added.length > 0) {
    const names = diff.members.added.map((m) => m.name)
    return {
      title,
      description: formatMembersLine(names, '添加了'),
      sections: {
        members: { kind: 'added', names, verb: '添加了' }
      }
    }
  }
  if (diff.members?.removed && diff.members.removed.length > 0) {
    const names = diff.members.removed.map((m) => m.name)
    return {
      title,
      description: formatMembersLine(names, '移除了'),
      sections: {
        members: { kind: 'removed', names, verb: '移除了' }
      }
    }
  }

  // 4. 权限分配
  if (diff.permissions?.added?.length || diff.permissions?.removed?.length) {
    const sections: { kind: 'added' | 'removed'; permissions: AuditDiffPermission[] }[] = []
    if (diff.permissions.added && diff.permissions.added.length > 0) {
      sections.push({ kind: 'added', permissions: diff.permissions.added })
    }
    if (diff.permissions.removed && diff.permissions.removed.length > 0) {
      sections.push({ kind: 'removed', permissions: diff.permissions.removed })
    }
    return {
      title,
      description: formatPermissionSectionsText(sections),
      sections: { permissions: sections }
    }
  }

  // 5. 查询与导出条件
  if (diff.query) {
    const filterText = diff.query.filters.map((f) => `${f.label}=${f.value}`).join('、')
    const countText = diff.query.count != null ? ` 共 ${diff.query.count} 条` : ''
    return {
      title,
      description: `${diff.summary ?? title}${countText}${filterText ? `（筛选：${filterText}）` : ''}`,
      sections: { filters: diff.query.filters }
    }
  }

  // 6. 敏感信息查看
  if (diff.sensitive) {
    const fieldsText = diff.sensitive.fields.map((f) => f.label).join('、')
    const name = diff.sensitive.subject.name ?? '用户'
    return {
      title,
      description: `查看了${name}的${fieldsText}`
    }
  }

  // 7. 摘要兜底
  return {
    title,
    description: diff.summary ?? entry?.fallback ?? null
  }
}

/** 格式化数字为千分位 */
export function formatTokens(n: number | bigint): string {
  const num = typeof n === 'bigint' ? Number(n) : n
  return num.toLocaleString('zh-CN')
}

/**
 * 格式化微元为人民币元（保留 2 位小数，不足 ¥0.01 显示 <¥0.01）
 */
export function formatCostMicros(micros: number | bigint): string {
  const m = typeof micros === 'bigint' ? Number(micros) : micros
  if (m <= 0) return '¥0.00'
  const yuan = m / 1_000_000
  if (yuan < 0.01) return '<¥0.01'
  return `¥${yuan.toFixed(2)}`
}

/** 格式化耗时 */
export function formatDuration(ms?: number | null): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * 格式化操作者名
 * @param actor.actorType 'user' | 'agent' | 'system' | 'api_key'
 */
export function formatAuditActor(actor: {
  actorName?: string | null
  actorType?: 'user' | 'agent' | 'system' | 'api_key' | string
  agentApproverName?: string | null
}): string {
  const name = actor.actorName || '系统'
  if (actor.actorType === 'agent') {
    return `AI 助手（代 ${name}）`
  }
  if (actor.actorType === 'system') {
    return '系统'
  }
  if (actor.actorType === 'api_key') {
    return `API Key（${name}）`
  }
  return name
}

/**
 * AgentRun 结构化描述渲染
 */
export function describeAgentRun(run: {
  model?: string | null
  stepCount?: number
  toolCallCount?: number
  totalTokens?: number
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  costMicros?: bigint | number
  durationMs?: number | null
  status?: string
}): { title: string; description: string } {
  const model = run.model ?? 'AI 模型'
  const steps = run.stepCount ?? 0
  const tools = run.toolCallCount ?? 0
  const total = run.totalTokens ?? (run.inputTokens ?? 0) + (run.outputTokens ?? 0)
  const cached = run.cachedInputTokens ?? 0
  const cost = formatCostMicros(run.costMicros ?? 0)
  const duration = formatDuration(run.durationMs)

  if (run.status === 'failed') {
    return {
      title: 'AI 任务失败',
      description: `使用 ${model} 执行失败，已消耗 ${formatTokens(total)} tokens，${cost}`
    }
  }

  if (run.status === 'aborted' || run.status === 'cancelled') {
    return {
      title: 'AI 任务被中止',
      description: `用户中止，使用 ${model}，消耗 ${formatTokens(total)} tokens`
    }
  }

  const cachedPart = cached > 0 ? `，其中缓存命中 ${formatTokens(cached)}` : ''
  const stepPart = steps > 0 ? ` 共 ${steps} 步` : ''
  const toolPart = tools > 0 ? `，调用 ${tools} 个工具` : ''

  return {
    title: '完成了 AI 任务',
    description: `使用 ${model}${stepPart}${toolPart}，消耗 ${formatTokens(total)} tokens（输入 ${formatTokens(run.inputTokens ?? 0)} / 输出 ${formatTokens(run.outputTokens ?? 0)}${cachedPart}），约 ${cost}，耗时 ${duration}`
  }
}
