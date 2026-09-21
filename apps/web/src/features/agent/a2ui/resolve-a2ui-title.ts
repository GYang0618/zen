import { parseToolCallArguments } from '../lib/group-tool-calls'
import { formatToolTitle } from '../lib/tool-title'

import type { ToolCallLike } from '../lib/group-tool-calls'

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/** 从 render_a2ui 参数中读取 AI 给出的界面标题（优先于组件内标题推断）。 */
export function readA2uiArgsTitle(args: Record<string, unknown> | undefined): string | undefined {
  if (!args) return undefined

  const topLevel = readNonEmptyString(args.title)
  if (topLevel) return topLevel

  const meta = args.meta
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const metaTitle = readNonEmptyString((meta as { title?: unknown }).title)
    if (metaTitle) return metaTitle
  }

  const data = args.data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const dataTitle = readNonEmptyString((data as { title?: unknown }).title)
    if (dataTitle) return dataTitle
  }

  return undefined
}

/**
 * 流式 arguments 尚未凑成合法 JSON 时，尽力从原始字符串中提取 title。
 * 便于徽章在参数流式阶段尽早展示「正在生成【标题】中…」。
 */
export function peekA2uiTitleFromArgumentsRaw(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const match = /"title"\s*:\s*"((?:\\.|[^"\\])*)"/.exec(raw)
  if (!match?.[1]) return undefined
  try {
    return readNonEmptyString(JSON.parse(`"${match[1]}"`) as unknown)
  } catch {
    return readNonEmptyString(match[1].replace(/\\"/g, '"'))
  }
}

/**
 * 对话徽章 / 工作区标签用的 A2UI 标题。
 * 优先用模型在 tool args 中给出的概括标题，其次用组件树推断，最后回退到工具名映射。
 */
export function resolveA2uiToolCallTitle(
  toolCall: ToolCallLike | undefined,
  inferredTitle?: string
): string {
  const name = toolCall?.function?.name ?? ''
  const args = parseToolCallArguments(toolCall)
  return (
    readA2uiArgsTitle(args) ??
    peekA2uiTitleFromArgumentsRaw(toolCall?.function?.arguments) ??
    readNonEmptyString(inferredTitle) ??
    formatToolTitle(name)
  )
}
