/** 对话中以表格等专属结果 UI 展示的查询工具。 */
export const GENERATIVE_UI_TOOL_NAMES = ['query_users_list', 'query_job_profiles_list'] as const

export const GENERATIVE_UI_TOOL_NAME_SET: ReadonlySet<string> = new Set(GENERATIVE_UI_TOOL_NAMES)

export interface ToolCallLike {
  id?: string
  function?: {
    name?: string
    arguments?: string
  }
}

export interface AssistantToolMessageLike {
  id: string
  role: string
  content?: string
  toolCalls?: ToolCallLike[]
}

const TRANSPARENT_ROLES = new Set(['reasoning', 'activity', 'tool'])

export function getToolCallName(toolCall: ToolCallLike | undefined): string | undefined {
  const name = toolCall?.function?.name
  return name && name.length > 0 ? name : undefined
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
      if (next.content?.trim()) break
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
