/** 临时标题最大长度（业界常见 20–30 字） */
export const THREAD_PROVISIONAL_TITLE_MAX_LENGTH = 30

/** 精炼标题最大长度 */
export const THREAD_GENERATED_TITLE_MAX_LENGTH = 20

const FALLBACK_THREAD_TITLE = '新对话'

/**
 * 从首条用户消息提取临时标题：取第一句话，截断到 maxLength。
 * 用于消息发出后立刻展示，随后可由 LLM 精炼标题静默替换。
 */
export function deriveProvisionalThreadTitle(
  content: string,
  maxLength = THREAD_PROVISIONAL_TITLE_MAX_LENGTH
): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return FALLBACK_THREAD_TITLE

  const sentenceEnd = normalized.search(/[。！？.!?\n]/)
  const firstSentence = sentenceEnd >= 0 ? normalized.slice(0, sentenceEnd + 1).trim() : normalized
  const withoutTrailingPunctuation = firstSentence.replace(/[。！？.!?,，、;；:：]+$/u, '').trim()
  const source = withoutTrailingPunctuation || firstSentence

  if (source.length <= maxLength) return source
  return source.slice(0, maxLength).trimEnd()
}

/**
 * 判断当前标题是否仍是「可被 LLM 静默替换」的临时标题。
 * 用户手动重命名后的标题不会匹配，从而不会被覆盖。
 */
export function isReplaceableProvisionalTitle(
  currentTitle: string | null | undefined,
  firstUserMessage: string
): boolean {
  if (!currentTitle || currentTitle.trim().length === 0) return true

  const provisional = deriveProvisionalThreadTitle(firstUserMessage)
  if (currentTitle === provisional) return true

  // 兼容早期 15 字截断与未抽首句的临时标题
  const normalized = firstUserMessage.replace(/\s+/g, ' ').trim()
  const legacyCandidates = [
    normalized.slice(0, 15),
    normalized.slice(0, THREAD_PROVISIONAL_TITLE_MAX_LENGTH),
    firstUserMessage.trim().slice(0, 15)
  ]

  return legacyCandidates.includes(currentTitle)
}

/** 去掉推理模型可能附带的思考块，只保留可见标题文本。 */
export function sanitizeChatModelTitleOutput(raw: string): string {
  let text = raw.replace(/\r\n/g, '\n').trim()
  text = text.replace(/[\s\S]*?<\/think>/gi, '').trim()
  text = text.replace(/^[\s\S]*?<\/think>\s*/i, '').trim()
  return text
}
