export interface ActivityMessageLike {
  id?: string
  role: string
  content?: unknown
  toolCalls?: unknown
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
    if (message && !isPlaceholderMessage(message)) return message
  }
  return undefined
}

function lastAssistantWithText<T extends ActivityMessageLike>(
  messages: readonly T[]
): T | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role === 'assistant' && hasTextContent(message.content)) return message
  }
  return undefined
}

/**
 * 可见回复已经在流式输出，或本轮纯文本答案已经写完。
 * 末尾即使跟上 tool / 空占位 / 空工具调用，也不该再亮底部活动条。
 */
export function isStreamingAssistantText(
  messages: readonly ActivityMessageLike[],
  isRunning: boolean
): boolean {
  if (!isRunning) return false

  const lastTextAssistant = lastAssistantWithText(messages)
  if (lastTextAssistant && isTextOnlyAssistant(lastTextAssistant)) return true

  const last = lastMeaningfulMessage(messages)
  if (last?.role === 'reasoning') return true
  return last?.role === 'assistant' && hasTextContent(last.content)
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
