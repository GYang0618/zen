import { DEDICATED_RESULT_UI_TOOL_NAMES, TOOL_TITLES } from '@zen/shared'

const DEDICATED_RESULT_UI_TOOL_SET: ReadonlySet<string> = new Set(DEDICATED_RESULT_UI_TOOL_NAMES)
const TOOL_NAMES_BY_LENGTH = Object.keys(TOOL_TITLES).sort((a, b) => b.length - a.length)

function isKnownToolName(name: string): boolean {
  return name in TOOL_TITLES
}

function stripQueryPrefix(title: string): string {
  return title.replace(/^查询/, '')
}

export function getToolTitle(name: string): string {
  return TOOL_TITLES[name] ?? name.replaceAll('_', ' ')
}

/** 思考过程对外展示用语：检索/办理，而不是「调用工具」。 */
export function getToolReasoningPhrase(name: string, phase: 'pending' | 'done'): string {
  const title = getToolTitle(name)
  if (phase === 'done') {
    return name.startsWith('query_') ? `${stripQueryPrefix(title)}已就绪` : `${title}已完成`
  }
  return name.startsWith('query_') ? `正在检索${stripQueryPrefix(title)}` : `正在${title}`
}

function replaceToolInvocations(text: string, pattern: RegExp, phase: 'pending' | 'done'): string {
  return text.replace(pattern, (matched, toolName: string) => {
    return isKnownToolName(toolName) ? getToolReasoningPhrase(toolName, phase) : matched
  })
}

/**
 * 将思考文案中的工具调用口吻改写为业务语义，避免把函数名展示给用户。
 * 模型仍可能漏出「需要调用 xxx 工具」；此函数作为展示层兜底。
 */
export function sanitizeReasoningContent(text: string): string {
  if (!text) return text

  const donePattern =
    /(?:我)?已经(?:成功)?(?:调用|使用)(?:了)?\s*[`'「」""']?([a-z][a-z0-9_]*)[`'「」""']?\s*(?:这个|该)?(?:工具|tool)?/gi
  const pendingPattern =
    /(?:我)?(?:需要|将要|准备|打算|先|接下来)?(?:去)?(?:调用|使用)(?:一下)?\s*[`'「」""']?([a-z][a-z0-9_]*)[`'「」""']?\s*(?:这个|该)?(?:工具|tool)?/gi

  let result = replaceToolInvocations(text, donePattern, 'done')
  result = replaceToolInvocations(result, pendingPattern, 'pending')

  for (const name of TOOL_NAMES_BY_LENGTH) {
    result = result.replaceAll(name, getToolTitle(name))
  }

  return result.replace(/[ \t]{2,}/g, ' ')
}

export function hasDedicatedResultUi(name: string | undefined): boolean {
  return Boolean(name && DEDICATED_RESULT_UI_TOOL_SET.has(name))
}
