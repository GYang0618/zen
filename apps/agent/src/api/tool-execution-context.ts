import {
  ACCESS_TOKEN_CONFIGURABLE_KEY,
  ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY,
  AGENT_APPROVAL_ID_CONFIGURABLE_KEY,
  AGENT_LOCALE_CONFIGURABLE_KEY,
  AGENT_MODEL_METADATA_CONFIGURABLE_KEY,
  AGENT_PERMISSIONS_CONFIGURABLE_KEY,
  AGENT_RUN_ID_CONFIGURABLE_KEY,
  AGENT_TENANT_ID_CONFIGURABLE_KEY,
  AGENT_THREAD_ID_CONFIGURABLE_KEY,
  AGENT_TOOL_NAME_CONFIGURABLE_KEY,
  AGENT_TRACE_ID_CONFIGURABLE_KEY,
  AGENT_USER_ID_CONFIGURABLE_KEY,
  toolExecutionContextSchema
} from '@zen/shared'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { ToolExecutionContext } from '@zen/shared'

const UNSPECIFIED_ID = 'unknown'
const UNSPECIFIED_TOOL_NAME = 'unknown_tool'
const DEFAULT_LOCALE = 'zh-CN'
const DEFAULT_MEMORY_MAX_CHARS = 6_000

type AgentRunnableConfig = RunnableConfig & {
  toolCallId?: string
  toolCall?: { id?: string; name?: string }
  context?: unknown
  config?: RunnableConfig & {
    context?: unknown
    toolCall?: { id?: string; name?: string }
  }
}

function asAgentConfig(config: RunnableConfig | undefined): AgentRunnableConfig | undefined {
  return config as AgentRunnableConfig | undefined
}

function configRecords(config: RunnableConfig | undefined): Record<string, unknown>[] {
  const toolConfig = asAgentConfig(config)
  const records: Record<string, unknown>[] = []
  for (const candidate of [
    toolConfig?.configurable,
    toolConfig?.context,
    toolConfig?.config?.configurable,
    toolConfig?.config?.context
  ]) {
    if (candidate && typeof candidate === 'object') {
      records.push(candidate as Record<string, unknown>)
    }
  }
  return records
}

function firstNonEmptyString(values: readonly unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value
  }
  return undefined
}

export function readConfigString(
  config: RunnableConfig | undefined,
  key: string
): string | undefined {
  for (const record of configRecords(config)) {
    const value = record[key]
    if (typeof value === 'string' && value) return value
  }
  return undefined
}

export function readConfigStringArray(config: RunnableConfig | undefined, key: string): string[] {
  for (const record of configRecords(config)) {
    const value = record[key]
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    }
  }
  return []
}

export function resolveToolCallIdentity(config: RunnableConfig | undefined): {
  toolCallId?: string
  toolName?: string
} {
  const toolConfig = asAgentConfig(config)
  const rec = toolConfig as Record<string, unknown> | undefined
  const configurable = rec?.configurable as Record<string, unknown> | undefined
  const metadata = rec?.metadata as Record<string, unknown> | undefined
  const nested = rec?.config as Record<string, unknown> | undefined

  const toolCallId = firstNonEmptyString([
    rec?.toolCallId,
    rec?.tool_call_id,
    toolConfig?.toolCallId,
    toolConfig?.toolCall?.id,
    toolConfig?.config?.toolCall?.id,
    (rec?.toolCall as { id?: string } | undefined)?.id,
    (nested?.toolCall as { id?: string } | undefined)?.id,
    configurable?.toolCallId,
    configurable?.tool_call_id,
    metadata?.tool_call_id,
    metadata?.toolCallId,
    readConfigString(config, 'toolCallId'),
    readConfigString(config, 'tool_call_id')
  ])

  const toolName =
    toolConfig?.toolCall?.name ??
    toolConfig?.config?.toolCall?.name ??
    readConfigString(config, AGENT_TOOL_NAME_CONFIGURABLE_KEY)

  return { toolCallId, toolName }
}

/** 从 LangGraph config 组装 ToolExecutionContext；写操作调用方必须 fail closed。 */
export function resolveToolExecutionContext(
  config: RunnableConfig | undefined
): { context: ToolExecutionContext } | { error: string } {
  const toolConfig = asAgentConfig(config)
  const { toolCallId, toolName } = resolveToolCallIdentity(config)
  const metadata = toolConfig?.metadata as Record<string, unknown> | undefined
  const parsed = toolExecutionContextSchema.safeParse({
    tenantId: readConfigString(config, AGENT_TENANT_ID_CONFIGURABLE_KEY),
    userId: readConfigString(config, AGENT_USER_ID_CONFIGURABLE_KEY),
    threadId:
      readConfigString(config, AGENT_THREAD_ID_CONFIGURABLE_KEY) ??
      readConfigString(config, 'thread_id') ??
      readConfigString(config, 'threadId'),
    runId:
      readConfigString(config, AGENT_RUN_ID_CONFIGURABLE_KEY) ??
      toolConfig?.runId ??
      firstNonEmptyString([metadata?.run_id, metadata?.runId]) ??
      readConfigString(config, 'run_id') ??
      readConfigString(config, 'runId'),
    traceId: readConfigString(config, AGENT_TRACE_ID_CONFIGURABLE_KEY),
    accessToken: readConfigString(config, ACCESS_TOKEN_CONFIGURABLE_KEY),
    locale: readConfigString(config, AGENT_LOCALE_CONFIGURABLE_KEY) ?? DEFAULT_LOCALE,
    permissions: readConfigStringArray(config, AGENT_PERMISSIONS_CONFIGURABLE_KEY),
    activePluginIds: readConfigStringArray(config, ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY),
    modelMetadata: readModelMetadata(config),
    toolName,
    toolCallId,
    approvalId: readConfigString(config, AGENT_APPROVAL_ID_CONFIGURABLE_KEY),
    abortSignal: config?.signal
  })
  if (!parsed.success) {
    return { error: parsed.error.issues.map((issue) => issue.message).join('; ') }
  }
  return { context: parsed.data }
}

/** 读操作在上下文不完整时仍可执行，使用占位标识而不是拒绝。 */
export function createReadFallbackContext(
  config: RunnableConfig | undefined,
  accessToken: string
): ToolExecutionContext {
  const { toolCallId, toolName } = resolveToolCallIdentity(config)
  return {
    tenantId: UNSPECIFIED_ID,
    userId: UNSPECIFIED_ID,
    threadId: UNSPECIFIED_ID,
    runId: UNSPECIFIED_ID,
    accessToken,
    locale: readConfigString(config, AGENT_LOCALE_CONFIGURABLE_KEY) ?? DEFAULT_LOCALE,
    permissions: [],
    activePluginIds: [],
    memory: { includeLongTerm: false, maxChars: DEFAULT_MEMORY_MAX_CHARS },
    toolName: toolName ?? UNSPECIFIED_TOOL_NAME,
    toolCallId: toolCallId ?? UNSPECIFIED_ID,
    abortSignal: config?.signal
  }
}

function readModelMetadata(config: RunnableConfig | undefined) {
  for (const record of configRecords(config)) {
    const value = record[AGENT_MODEL_METADATA_CONFIGURABLE_KEY]
    if (value && typeof value === 'object') return value
  }
  return undefined
}
