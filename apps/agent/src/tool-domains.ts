import type { TOOL_EXECUTION_POLICIES } from './tool-policy'

export type ToolDomainId = 'user' | 'role' | 'organization' | 'post' | 'plugin'

interface ToolDomain {
  id: ToolDomainId
  tools: readonly string[]
  keywords: readonly string[]
}

const USER_TOOLS = [
  'query_users_list',
  'query_user_detail',
  'create_user',
  'update_user_info',
  'restore_deleted_users',
  'update_user_status',
  'unlock_user',
  'reset_user_password',
  'revoke_user_sessions',
  'assign_user_roles',
  'replace_user_organizations',
  'delete_users',
  'hard_delete_users'
] as const satisfies ReadonlyArray<keyof typeof TOOL_EXECUTION_POLICIES>

const ROLE_TOOLS = [
  'query_roles_list',
  'query_role_detail',
  'query_permissions_list',
  'query_role_members',
  'create_role',
  'update_role_info',
  'clone_role',
  'add_role_members',
  'remove_role_member',
  'assign_role_permissions',
  'assign_role_data_scope',
  'delete_roles'
] as const satisfies ReadonlyArray<keyof typeof TOOL_EXECUTION_POLICIES>

const ORGANIZATION_TOOLS = [
  'query_organization_tree',
  'query_organization_type_catalog',
  'query_organization_detail',
  'query_organization_members',
  'query_organization_positions',
  'query_organization_activities',
  'update_organization_type_catalog',
  'create_organization',
  'update_organization_info',
  'update_organization_leader',
  'change_organization_parent',
  'add_organization_member',
  'remove_organization_member',
  'create_organization_position',
  'update_organization_position',
  'remove_organization_position'
] as const satisfies ReadonlyArray<keyof typeof TOOL_EXECUTION_POLICIES>

const POST_TOOLS = [
  'query_job_profiles_list',
  'query_job_profile_detail',
  'create_job_profile',
  'update_job_profile_info',
  'delete_job_profile'
] as const satisfies ReadonlyArray<keyof typeof TOOL_EXECUTION_POLICIES>

const PLUGIN_TOOLS = ['list_demo_notes'] as const satisfies ReadonlyArray<
  keyof typeof TOOL_EXECUTION_POLICIES
>

export const TOOL_DOMAINS: readonly ToolDomain[] = [
  {
    id: 'user',
    tools: USER_TOOLS,
    keywords: ['用户', '账号', '邮箱', 'gmail', 'google', '密码', '登录', '会话', '锁定', '昵称']
  },
  {
    id: 'role',
    tools: ROLE_TOOLS,
    keywords: ['角色', '权限', '数据范围']
  },
  {
    id: 'organization',
    tools: ORGANIZATION_TOOLS,
    keywords: ['组织', '部门', '编制', '组织树', '负责人']
  },
  {
    id: 'post',
    tools: POST_TOOLS,
    keywords: ['岗位', '职位', 'pos-']
  },
  {
    id: 'plugin',
    tools: PLUGIN_TOOLS,
    keywords: ['笔记', 'note', 'demo']
  }
]

const TOOL_DOMAIN_BY_NAME = new Map(
  TOOL_DOMAINS.flatMap((domain) => domain.tools.map((toolName) => [toolName, domain.id] as const))
)

export function collectConversationHints(messages: readonly unknown[]): {
  text: string
  recentToolNames: string[]
} {
  let text = ''
  const recentToolNames: string[] = []

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = asRecord(messages[index])
    if (!message) continue
    if (!text && isHumanMessage(message, messages[index])) {
      text = contentToText(message.content)
    }
    for (const toolName of toolNamesOf(message)) {
      if (recentToolNames.length < 8) recentToolNames.push(toolName)
    }
  }

  return { text, recentToolNames }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function isHumanMessage(record: Record<string, unknown>, raw: unknown): boolean {
  if (record.type === 'human' || record.role === 'human' || record.role === 'user') return true
  if (raw && typeof raw === 'object' && 'getType' in raw) {
    const getType = (raw as { getType?: () => string }).getType
    return typeof getType === 'function' && getType.call(raw) === 'human'
  }
  return false
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((block) => {
      const record = asRecord(block)
      return typeof record?.text === 'string' ? record.text : ''
    })
    .join('')
}

function toolNamesOf(record: Record<string, unknown>): string[] {
  const names: string[] = []
  if (Array.isArray(record.tool_calls)) {
    for (const call of record.tool_calls) {
      const name = asRecord(call)?.name
      if (typeof name === 'string' && name) names.push(name)
    }
  }
  if (typeof record.name === 'string' && record.name) names.push(record.name)
  return names
}

export function resolveToolDomains(
  text: string,
  recentToolNames: readonly string[]
): Set<ToolDomainId> {
  const matched = new Set<ToolDomainId>()
  const haystack = text.toLowerCase()

  for (const domain of TOOL_DOMAINS) {
    if (domain.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
      matched.add(domain.id)
    }
  }

  for (const toolName of recentToolNames) {
    const domainId = TOOL_DOMAIN_BY_NAME.get(toolName)
    if (domainId) matched.add(domainId)
  }

  return matched
}

export function selectToolNamesForDomains(
  availableNames: readonly string[],
  domains: ReadonlySet<ToolDomainId>
): string[] | undefined {
  if (domains.size === 0) return undefined
  const allowed = new Set(
    TOOL_DOMAINS.filter((domain) => domains.has(domain.id)).flatMap((domain) => [...domain.tools])
  )
  const selected = availableNames.filter((name) => allowed.has(name))
  return selected.length ? selected : undefined
}
