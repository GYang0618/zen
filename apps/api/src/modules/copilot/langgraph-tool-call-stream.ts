const AGUI_EVENT = {
  TOOL_CALL_START: 'TOOL_CALL_START',
  TOOL_CALL_ARGS: 'TOOL_CALL_ARGS',
  TOOL_CALL_END: 'TOOL_CALL_END'
} as const

export const LANGGRAPH_EVENT = {
  ON_CHAT_MODEL_STREAM: 'on_chat_model_stream',
  ON_CHAT_MODEL_END: 'on_chat_model_end',
  ON_TOOL_START: 'on_tool_start'
} as const

export interface LangGraphStreamEvent {
  event?: string
  name?: unknown
  data?: unknown
  metadata?: unknown
}

export interface ExtractedToolCall {
  id: string
  name: string
  args: unknown
  parentMessageId?: string
}

export interface AguiToolCallEvent {
  type: (typeof AGUI_EVENT)[keyof typeof AGUI_EVENT]
  toolCallId: string
  toolCallName?: string
  parentMessageId?: string
  delta?: string
  rawEvent?: unknown
}

export interface ToolCallStreamSink {
  emittedToolCallStartIds: Set<string>
  dispatchEvent: (event: AguiToolCallEvent) => boolean
  activeRun?: {
    hasFunctionStreaming?: boolean
    modelMadeToolCall?: boolean
  }
}

interface ReasoningChunk {
  chunk?: {
    additional_kwargs?: {
      reasoning_content?: string | null
    }
  }
}

export interface ReasoningProcessHolder {
  reasoningProcess: unknown
}

/** 从 Qwen 等模型的 additional_kwargs 中取出推理增量。 */
export function resolveReasoningContent(
  data: unknown
): { text: string; type: 'text'; index: number } | null {
  const reasoningContent = (data as ReasoningChunk)?.chunk?.additional_kwargs?.reasoning_content

  if (typeof reasoningContent !== 'string' || reasoningContent.length === 0) {
    return null
  }

  return {
    text: reasoningContent,
    type: 'text',
    index: 0
  }
}

/** chunk 是否还带有需要交给 AG-UI 处理的正文 / 工具增量。 */
export function chunkHasAssistantDelta(data: unknown): boolean {
  const chunk = asRecord(asRecord(data)?.chunk)
  if (!chunk) return false

  const toolChunks = chunk.tool_call_chunks
  if (Array.isArray(toolChunks) && toolChunks.length > 0) return true

  const content = chunk.content
  if (typeof content === 'string') return content.length > 0
  if (!Array.isArray(content)) return false

  return content.some((part) => {
    const record = asRecord(part)
    if (!record) return typeof part === 'string' && part.length > 0
    if (record.type !== 'text') return false
    return typeof record.text === 'string' && record.text.length > 0
  })
}

/**
 * AG-UI 只认 content 数组里的 reasoning。Qwen 走 additional_kwargs 时，
 * 若已有 reasoningProcess，它会立刻 REASONING_END，每个 token 变成一条「思考了 1 秒」。
 * 交给 super 处理正文/工具前，先把我们打开的推理过程藏起来。
 */
export function runWithoutReasoningProcess<T>(holder: ReasoningProcessHolder, run: () => T): T {
  const snapshot = holder.reasoningProcess
  holder.reasoningProcess = null
  try {
    return run()
  } finally {
    if (snapshot !== undefined && snapshot !== null && holder.reasoningProcess == null) {
      holder.reasoningProcess = snapshot
    }
  }
}

/** 从 on_chat_model_end 的 AIMessage（扁平或 LangChain 序列化）取出全部 tool_calls。 */
export function extractToolCallsFromModelEnd(data: unknown): ExtractedToolCall[] {
  const record = asRecord(data)
  if (!record) return []

  const message = unwrapMessage(record.output ?? record)
  if (!message) return []

  const rawCalls = message.tool_calls ?? message.toolCalls
  if (!Array.isArray(rawCalls)) return []

  const parentMessageId = readString(message.id)

  return rawCalls.flatMap((call) => {
    const parsed = parseToolCall(call, parentMessageId)
    return parsed ? [parsed] : []
  })
}

/** 从 on_tool_start 取出 tool_call_id / 名称 / 入参。缺少 id 时返回 null，避免用 run_id 冒充。 */
export function extractToolCallFromToolStart(
  event: LangGraphStreamEvent
): ExtractedToolCall | null {
  const name = readString(event.name)
  const metadata = asRecord(event.metadata)
  const toolCallId =
    readString(metadata?.langgraph_tool_call_id) ?? readString(metadata?.tool_call_id)

  if (!name || !toolCallId) return null

  const data = asRecord(event.data)
  return {
    id: toolCallId,
    name,
    args: data?.input ?? {},
    parentMessageId: toolCallId
  }
}

export function stringifyToolArgs(args: unknown): string {
  if (typeof args === 'string') return args

  try {
    return JSON.stringify(args ?? {})
  } catch {
    return '{}'
  }
}

/**
 * 把尚未推给前端的工具调用补成 START → ARGS → END。
 * AG-UI 只在 on_tool_end 才补发，批量工具会卡到全部跑完才出现「已完成」。
 */
export function emitPendingToolCalls(
  sink: ToolCallStreamSink,
  toolCalls: ExtractedToolCall[],
  rawEvent: unknown
): void {
  for (const toolCall of toolCalls) {
    if (sink.emittedToolCallStartIds.has(toolCall.id)) continue

    sink.emittedToolCallStartIds.add(toolCall.id)
    if (sink.activeRun) {
      sink.activeRun.hasFunctionStreaming = true
      sink.activeRun.modelMadeToolCall = true
    }

    const parentMessageId = toolCall.parentMessageId ?? toolCall.id

    sink.dispatchEvent({
      type: AGUI_EVENT.TOOL_CALL_START,
      toolCallId: toolCall.id,
      toolCallName: toolCall.name,
      parentMessageId,
      rawEvent
    })
    sink.dispatchEvent({
      type: AGUI_EVENT.TOOL_CALL_ARGS,
      toolCallId: toolCall.id,
      delta: stringifyToolArgs(toolCall.args),
      rawEvent
    })
    sink.dispatchEvent({
      type: AGUI_EVENT.TOOL_CALL_END,
      toolCallId: toolCall.id,
      rawEvent
    })
  }
}

function parseToolCall(value: unknown, parentMessageId?: string): ExtractedToolCall | null {
  const record = asRecord(value)
  if (!record) return null

  const nested = asRecord(record.function)
  const id = readString(record.id)
  const name = readString(record.name) ?? readString(nested?.name)
  if (!id || !name) return null

  const args = record.args ?? nested?.arguments ?? {}
  return { id, name, args, parentMessageId }
}

function unwrapMessage(output: unknown): Record<string, unknown> | null {
  const record = asRecord(output)
  if (!record) return null

  const kwargs = asRecord(record.kwargs)
  if (kwargs) {
    return {
      ...kwargs,
      id: kwargs.id ?? record.id
    }
  }

  return record
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
