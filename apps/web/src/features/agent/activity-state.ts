export interface ActivityMessageLike {
  id?: string
  role: string
  content?: unknown
  toolCalls?: unknown
  toolCallId?: string
}

function hasTextContent(content: unknown): boolean {
  return typeof content === 'string' && content.trim().length > 0
}

function hasToolCalls(toolCalls: unknown): boolean {
  return Array.isArray(toolCalls) && toolCalls.length > 0
}

function hasAssistantWork(message: ActivityMessageLike): boolean {
  return hasTextContent(message.content) || hasToolCalls(message.toolCalls)
}

function isTextOnlyAssistant(message: ActivityMessageLike): boolean {
  return (
    message.role === 'assistant' &&
    hasTextContent(message.content) &&
    !hasToolCalls(message.toolCalls)
  )
}

function toolCallIdOf(toolCall: unknown): string | undefined {
  if (!toolCall || typeof toolCall !== 'object') return undefined
  const id = (toolCall as { id?: unknown }).id
  return typeof id === 'string' && id.length > 0 ? id : undefined
}

/** 收尾阶段常出现的空 assistant / reasoning / activity，不代表下一轮真的开始了。 */
export function isPlaceholderMessage(message: ActivityMessageLike): boolean {
  if (message.role === 'activity') return true
  if (message.role === 'reasoning') return !hasTextContent(message.content)
  if (message.role === 'assistant') return !hasAssistantWork(message)
  return false
}

export function lastMeaningfulMessage<T extends ActivityMessageLike>(
  messages: readonly T[]
): T | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (!message || isPlaceholderMessage(message)) continue
    if (
      message.role === 'reasoning' &&
      message.id &&
      isTrailingReasoningAfterReply(messages, message.id)
    ) {
      continue
    }
    return message
  }
  return undefined
}

export function hasUnresolvedToolCalls(messages: readonly ActivityMessageLike[]): boolean {
  const resolvedIds = new Set(
    messages
      .filter((message) => message.role === 'tool')
      .map((message) => message.toolCallId)
      .filter((id): id is string => Boolean(id))
  )

  for (const message of messages) {
    if (message.role !== 'assistant' || !hasToolCalls(message.toolCalls)) continue
    for (const toolCall of message.toolCalls as unknown[]) {
      const id = toolCallIdOf(toolCall)
      if (id && !resolvedIds.has(id)) return true
    }
  }
  return false
}

/**
 * 文本段已经写完，但 run 还在：等工具、等下一跳模型、或下一条带 tool call 的 assistant。
 * 这时不应再把界面当成「正在流式打字」。
 */
export function isAwaitingAgentWork(
  messages: readonly ActivityMessageLike[],
  isRunning: boolean
): boolean {
  if (!isRunning) return false
  if (hasUnresolvedToolCalls(messages)) return true

  const last = lastMeaningfulMessage(messages)
  if (!last) return false
  if (last.role === 'tool') return true
  return last.role === 'assistant' && hasToolCalls(last.toolCalls)
}

/**
 * 当前可见回复是否仍在往外吐 token。
 * 纯文本段后的工具跳、已完成的 tool 结果、以及收尾 reasoning，都不算正在流式输出。
 */
export function isStreamingAssistantText(
  messages: readonly ActivityMessageLike[],
  isRunning: boolean
): boolean {
  if (!isRunning) return false
  if (isAwaitingAgentWork(messages, isRunning)) return false

  const last = lastMeaningfulMessage(messages)
  if (last?.role === 'reasoning') return true
  return last?.role === 'assistant' && hasTextContent(last.content)
}

/** 用消息尾部内容做签名：token 停更后可据此判定流式空窗。 */
export function streamingActivitySignature(messages: readonly ActivityMessageLike[]): string {
  const last = lastMeaningfulMessage(messages)
  if (!last) return String(messages.length)

  const content = typeof last.content === 'string' ? last.content : ''
  const unresolved = hasUnresolvedToolCalls(messages) ? '1' : '0'
  return `${messages.length}:${last.id ?? ''}:${last.role}:${unresolved}:${content}`
}

export function shouldShowActivityIndicator(input: {
  isRunning: boolean
  isStreamingText: boolean
  streamIdle: boolean
  activityLabel?: string
}): boolean {
  return Boolean(
    input.isRunning && (input.activityLabel || !input.isStreamingText || input.streamIdle)
  )
}

/** 纯文本答案之后又冒出来的 reasoning，是收尾噪声，不渲染。 */
export function isTrailingReasoningAfterReply(
  messages: readonly ActivityMessageLike[],
  reasoningId: string
): boolean {
  let lastTextOnlyIndex = -1
  let reasoningIndex = -1

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index]
    if (message.id === reasoningId && message.role === 'reasoning') reasoningIndex = index
    if (isTextOnlyAssistant(message)) lastTextOnlyIndex = index
  }

  return reasoningIndex >= 0 && lastTextOnlyIndex >= 0 && reasoningIndex > lastTextOnlyIndex
}
