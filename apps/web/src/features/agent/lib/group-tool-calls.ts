/** 对话中以表格等专属结果 UI 展示的查询工具（分组时不与同名写工具合并）。 */
export const GENERATIVE_UI_TOOL_NAMES = [
  'query_users_list',
  'query_job_profiles_list',
  'query_roles_list',
  'query_organizations_list',
  'query_organization_tree'
] as const

export const GENERATIVE_UI_TOOL_NAME_SET: ReadonlySet<string> = new Set(GENERATIVE_UI_TOOL_NAMES)

export interface ToolCallLike {
  id?: string
  function?: {
    name?: string
    arguments?: string
  }
}

/** 与 AG-UI Message 对齐：content 可能是文本、多模态 parts 或 activity payload。 */
export interface AssistantToolMessageLike {
  id: string
  role: string
  content?: unknown
  toolCalls?: ToolCallLike[]
}

const TRANSPARENT_ROLES = new Set(['reasoning', 'activity', 'tool'])

function hasNonEmptyTextContent(content: unknown): boolean {
  return typeof content === 'string' && content.trim().length > 0
}

export function getToolCallName(toolCall: ToolCallLike | undefined): string | undefined {
  const name = toolCall?.function?.name
  return name && name.length > 0 ? name : undefined
}

const chatSurfaceToolNames = new Set<string>()

/** useHumanInTheLoop 的界面挂到回合末，不进入工作轨迹。调用方在模块加载时登记名称。 */
export function registerChatSurfaceTool(name: string) {
  chatSurfaceToolNames.add(name)
}

export function isChatSurfaceToolCall(toolCall: ToolCallLike | undefined): boolean {
  const name = getToolCallName(toolCall)
  return Boolean(name && chatSurfaceToolNames.has(name))
}

/** 解析 tool call arguments；流式未完成或非法 JSON 时返回 undefined。 */
export function parseToolCallArguments(
  toolCall: ToolCallLike | undefined
): Record<string, unknown> | undefined {
  const raw = toolCall?.function?.arguments
  if (!raw || raw.trim().length === 0) return undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined
    return parsed as Record<string, unknown>
  } catch {
    return undefined
  }
}

function readDisplayFlag(args: Record<string, unknown>): boolean | undefined {
  const meta = args.meta
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const display = (meta as { display?: unknown }).display
    if (typeof display === 'boolean') return display
  }
  if (typeof args.display === 'boolean') return args.display
  return undefined
}

/**
 * Agent 通过 meta.display（或顶层 display）声明是否面向用户呈现专属结果 UI。
 * 仅当显式为 true 时挂到本轮最后一条助手消息与工具栏之间。
 */
export function isTurnFinalDisplayToolCall(toolCall: ToolCallLike | undefined): boolean {
  const args = parseToolCallArguments(toolCall)
  if (!args) return false
  return readDisplayFlag(args) === true
}

/** A2UI 等：未声明或 true 则展示；显式 false 则隐藏。 */
export function isToolCallDisplayEnabled(toolCall: ToolCallLike | undefined): boolean {
  const args = parseToolCallArguments(toolCall)
  if (!args) return true
  return readDisplayFlag(args) !== false
}

export function groupConsecutiveToolCalls<T extends ToolCallLike>(
  toolCalls: T[],
  ungroupedNames: ReadonlySet<string> = GENERATIVE_UI_TOOL_NAME_SET
): T[][] {
  const groups: T[][] = []

  for (const toolCall of toolCalls) {
    const name = getToolCallName(toolCall)
    const lastGroup = groups.at(-1)
    const lastName = lastGroup ? getToolCallName(lastGroup[0]) : undefined
    const canMerge = Boolean(lastGroup && name && lastName === name && !ungroupedNames.has(name))

    if (canMerge && lastGroup) {
      lastGroup.push(toolCall)
    } else {
      groups.push([toolCall])
    }
  }

  return groups
}

function exclusiveGroupableToolName(
  message: AssistantToolMessageLike,
  ungroupedNames: ReadonlySet<string>
): string | undefined {
  const names = (message.toolCalls ?? [])
    .map((toolCall) => getToolCallName(toolCall))
    .filter((name): name is string => Boolean(name))

  const first = names[0]
  if (!first || ungroupedNames.has(first)) return undefined
  if (names.some((name) => name !== first)) return undefined
  return first
}

/** 同名写工具在思考/活动消息之间连续出现时，后续 assistant 的工具卡片并入第一条。 */
export function collectAbsorbedAssistantIds<T extends AssistantToolMessageLike>(
  messages: T[],
  ungroupedNames: ReadonlySet<string> = GENERATIVE_UI_TOOL_NAME_SET
): Set<string> {
  const absorbed = new Set<string>()

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index]
    if (message.role !== 'assistant' || absorbed.has(message.id)) continue

    const name = exclusiveGroupableToolName(message, ungroupedNames)
    if (!name) continue

    for (let cursor = index + 1; cursor < messages.length; cursor += 1) {
      const next = messages[cursor]
      if (TRANSPARENT_ROLES.has(next.role)) continue
      if (next.role !== 'assistant') break
      if (hasNonEmptyTextContent(next.content)) break
      if (absorbed.has(next.id)) continue

      const nextName = exclusiveGroupableToolName(next, ungroupedNames)
      if (nextName !== name) break
      absorbed.add(next.id)
    }
  }

  return absorbed
}

export function collectAssistantToolCalls<T extends AssistantToolMessageLike>(
  messages: T[],
  startIndex: number,
  absorbedIds: Set<string>
): ToolCallLike[] {
  const start = messages[startIndex]
  if (start?.role !== 'assistant') return []

  const toolCalls = [...(start.toolCalls ?? [])]

  for (let cursor = startIndex + 1; cursor < messages.length; cursor += 1) {
    const next = messages[cursor]
    if (TRANSPARENT_ROLES.has(next.role)) continue
    if (next.role !== 'assistant') break
    if (!absorbedIds.has(next.id)) break
    toolCalls.push(...(next.toolCalls ?? []))
  }

  return toolCalls
}

export function resolveAssistantToolCalls<T extends AssistantToolMessageLike>(
  messages: T[],
  messageId: string,
  ungroupedNames: ReadonlySet<string> = GENERATIVE_UI_TOOL_NAME_SET
): { hidden: boolean; toolCalls: ToolCallLike[] } {
  const absorbedIds = collectAbsorbedAssistantIds(messages, ungroupedNames)
  if (absorbedIds.has(messageId)) {
    return { hidden: true, toolCalls: [] }
  }

  const startIndex = messages.findIndex((message) => message.id === messageId)
  if (startIndex === -1) {
    return { hidden: false, toolCalls: [] }
  }

  return {
    hidden: false,
    toolCalls: collectAssistantToolCalls(messages, startIndex, absorbedIds)
  }
}

function findTurnBounds<T extends { role: string }>(
  messages: T[],
  messageIndex: number
): { start: number; end: number } {
  let start = 0
  for (let index = messageIndex; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      start = index + 1
      break
    }
  }

  let end = messages.length
  for (let index = messageIndex + 1; index < messages.length; index += 1) {
    if (messages[index]?.role === 'user') {
      end = index
      break
    }
  }

  return { start, end }
}

/**
 * 将本轮（相邻两条 user 之间）匹配到的工具统一挂到该轮最后一条 assistant。
 * 非末条返回 shouldRender=false；末条返回本轮全部匹配的 toolCalls。
 */
export function resolveTurnToolCalls<T extends AssistantToolMessageLike>(
  messages: T[],
  messageId: string,
  match: (toolCall: ToolCallLike) => boolean
): { shouldRender: boolean; toolCalls: ToolCallLike[] } {
  const messageIndex = messages.findIndex((message) => message.id === messageId)
  if (messageIndex === -1) {
    return { shouldRender: false, toolCalls: [] }
  }

  const { start, end } = findTurnBounds(messages, messageIndex)
  const turnAssistants = messages
    .slice(start, end)
    .filter((message) => message.role === 'assistant')
  const lastAssistant = turnAssistants.at(-1)

  if (!lastAssistant || lastAssistant.id !== messageId) {
    return { shouldRender: false, toolCalls: [] }
  }

  const toolCalls: ToolCallLike[] = []
  for (const assistant of turnAssistants) {
    for (const toolCall of assistant.toolCalls ?? []) {
      if (match(toolCall)) {
        toolCalls.push(toolCall)
      }
    }
  }

  return { shouldRender: true, toolCalls }
}

/**
 * 将本轮 meta.display === true 的工具统一挂到该轮最后一条 assistant。
 */
export function resolveTurnGenerativeToolCalls<T extends AssistantToolMessageLike>(
  messages: T[],
  messageId: string
): { shouldRender: boolean; toolCalls: ToolCallLike[] } {
  return resolveTurnToolCalls(
    messages,
    messageId,
    (toolCall) => isTurnFinalDisplayToolCall(toolCall) || isChatSurfaceToolCall(toolCall)
  )
}
