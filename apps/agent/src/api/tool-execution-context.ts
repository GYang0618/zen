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

type AgentRunnableConfig = RunnableConfig & {
  toolCallId?: string
  toolCall?: { id?: string; name?: string }
  context?: unknown
  config?: RunnableConfig & {
    context?: unknown
    toolCall?: { id?: string; name?: string }
  }
}

export function readConfigString(
  config: AgentRunnableConfig | undefined,
  key: string
): string | undefined {
  for (const candidate of [
    config?.configurable,
    config?.context,
    config?.config?.configurable,
    config?.config?.context
  ]) {
    if (!candidate || typeof candidate !== 'object') continue
    const value = (candidate as Record<string, unknown>)[key]
    if (typeof value === 'string' && value) return value
  }
  return undefined
}

export function readConfigStringArray(
  config: AgentRunnableConfig | undefined,
  key: string
): string[] {
  for (const candidate of [
    config?.configurable,
    config?.context,
    config?.config?.configurable,
    config?.config?.context
  ]) {
    if (!candidate || typeof candidate !== 'object') continue
    const value = (candidate as Record<string, unknown>)[key]
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    }
  }
  return []
}

export function resolveToolCallIdentity(config: AgentRunnableConfig | undefined): {
  toolCallId?: string
  toolName?: string
} {
  const toolCallId =
    config?.toolCallId ?? config?.toolCall?.id ?? config?.config?.toolCall?.id ?? undefined
  const toolName =
    config?.toolCall?.name ??
    config?.config?.toolCall?.name ??
    readConfigString(config, AGENT_TOOL_NAME_CONFIGURABLE_KEY)
  return { toolCallId, toolName }
}

/** 从 LangGraph config 组装 ToolExecutionContext；写操作调用方必须 fail closed。 */
export function resolveToolExecutionContext(
  config: RunnableConfig | undefined
): { context: ToolExecutionContext } | { error: string } {
  const toolConfig = config as AgentRunnableConfig | undefined
  const { toolCallId, toolName } = resolveToolCallIdentity(toolConfig)
  const parsed = toolExecutionContextSchema.safeParse({
    tenantId: readConfigString(toolConfig, AGENT_TENANT_ID_CONFIGURABLE_KEY),
    userId: readConfigString(toolConfig, AGENT_USER_ID_CONFIGURABLE_KEY),
    threadId: readConfigString(toolConfig, AGENT_THREAD_ID_CONFIGURABLE_KEY),
    runId: readConfigString(toolConfig, AGENT_RUN_ID_CONFIGURABLE_KEY),
    traceId: readConfigString(toolConfig, AGENT_TRACE_ID_CONFIGURABLE_KEY),
    accessToken: readConfigString(toolConfig, ACCESS_TOKEN_CONFIGURABLE_KEY),
    locale: readConfigString(toolConfig, AGENT_LOCALE_CONFIGURABLE_KEY) ?? 'zh-CN',
    permissions: readConfigStringArray(toolConfig, AGENT_PERMISSIONS_CONFIGURABLE_KEY),
    activePluginIds: readConfigStringArray(toolConfig, ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY),
    modelMetadata: readModelMetadata(toolConfig),
    toolName,
    toolCallId,
    approvalId: readConfigString(toolConfig, AGENT_APPROVAL_ID_CONFIGURABLE_KEY),
    abortSignal: config?.signal
  })
  if (!parsed.success) {
    return { error: parsed.error.issues.map((issue) => issue.message).join('; ') }
  }
  return { context: parsed.data }
}

function readModelMetadata(config: AgentRunnableConfig | undefined) {
  for (const candidate of [
    config?.configurable,
    config?.context,
    config?.config?.configurable,
    config?.config?.context
  ]) {
    if (!candidate || typeof candidate !== 'object') continue
    const value = (candidate as Record<string, unknown>)[AGENT_MODEL_METADATA_CONFIGURABLE_KEY]
    if (value && typeof value === 'object') return value
  }
  return undefined
}
