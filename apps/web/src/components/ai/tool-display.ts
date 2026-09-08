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

export function getToolActivityLabel(name: string): string {
  return `正在${getToolTitle(name)}`
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

/** 内部查证不占用活动文案；写操作与专属 UI 查询会显示「正在…」。 */
export function isSilentLookupTool(name: string | undefined): boolean {
  if (!name) return false
  return name.startsWith('query_') && !hasDedicatedResultUi(name)
}

export function formatActiveToolsLabel(names: string[]): string | undefined {
  const uniqueTitles = [...new Set(names.map(getToolTitle))]
  if (uniqueTitles.length === 0) return undefined
  return `正在${uniqueTitles.join('、')}`
}

/** 有写操作时只提示写操作；仅内部查证时不占用活动文案。 */
export function resolveActivityToolNames(names: string[]): string[] {
  return names.filter((name) => !isSilentLookupTool(name))
}
