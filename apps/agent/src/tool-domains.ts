import { defaultAgentToolDescriptors } from './tools/registry'

export type ToolDomainId = 'user' | 'role' | 'organization' | 'post' | 'plugin'

const SIDE_EFFECT_TAGS = new Set(['read', 'write', 'none', 'destructive'])

/** 能力标签的语义别名。工具按 ToolManifest.capabilities 裁剪，而不是按关键词绑定工具名。 */
const CAPABILITY_ALIASES: Record<string, readonly string[]> = {
  user: ['user', '用户', '账号', '邮箱', 'gmail', 'google', '密码', '登录', '会话', '锁定', '昵称'],
  role: ['role', 'permission', '角色', '权限', '数据范围'],
  organization: ['organization', 'org', '组织', '部门', '编制', '组织树', '负责人'],
  post: ['post', 'job', '岗位', '职位', 'pos-'],
  plugin: ['plugin', 'note', '笔记', 'demo']
}

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

function domainCapabilitiesOf(toolName: string): string[] {
  const descriptor = defaultAgentToolDescriptors.find((item) => item.name === toolName)
  return (descriptor?.capabilities ?? []).filter((capability) => !SIDE_EFFECT_TAGS.has(capability))
}

export function resolveToolCapabilities(
  text: string,
  recentToolNames: readonly string[]
): Set<string> {
  const matched = new Set<string>()
  const haystack = text.toLowerCase()

  for (const [capability, aliases] of Object.entries(CAPABILITY_ALIASES)) {
    if (aliases.some((alias) => haystack.includes(alias.toLowerCase()))) {
      matched.add(capability)
    }
  }

  for (const toolName of recentToolNames) {
    for (const capability of domainCapabilitiesOf(toolName)) {
      matched.add(capability)
    }
  }

  return matched
}

export function selectToolNamesForCapabilities(
  availableNames: readonly string[],
  capabilities: ReadonlySet<string>
): string[] | undefined {
  if (capabilities.size === 0) return undefined
  const selected = availableNames.filter((name) =>
    domainCapabilitiesOf(name).some((capability) => capabilities.has(capability))
  )
  return selected.length ? selected : undefined
}

/** @deprecated 使用 resolveToolCapabilities；保留给过渡测试 */
export function resolveToolDomains(
  text: string,
  recentToolNames: readonly string[]
): Set<ToolDomainId> {
  const capabilities = resolveToolCapabilities(text, recentToolNames)
  return new Set(
    [...capabilities].filter((item): item is ToolDomainId =>
      ['user', 'role', 'organization', 'post', 'plugin'].includes(item)
    )
  )
}

/** @deprecated 使用 selectToolNamesForCapabilities */
export function selectToolNamesForDomains(
  availableNames: readonly string[],
  domains: ReadonlySet<ToolDomainId>
): string[] | undefined {
  return selectToolNamesForCapabilities(availableNames, domains)
}
