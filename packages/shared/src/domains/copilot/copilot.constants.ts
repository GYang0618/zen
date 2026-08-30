/** LangGraph RunnableConfig.configurable 中存放当前用户 JWT 的键名 */
export const ACCESS_TOKEN_CONFIGURABLE_KEY = 'accessToken'

/** 用户明确授权发送给 Qwen 的非敏感长期记忆 */
export const AGENT_MEMORY_CONFIGURABLE_KEY = 'agentMemory'

/** 当前 AG-UI Run ID，供 Tool 幂等键与 Artifact 关联使用。 */
export const AGENT_RUN_ID_CONFIGURABLE_KEY = 'agentRunId'

/** 当前租户允许 Default Agent 暴露 Tool 的 ACTIVE 插件 ID。 */
export const ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY = 'activeAgentPlugins'

/** Default Agent 的运行预算。远程 LangGraph 使用 snake_case 的 recursion_limit。 */
export const DEFAULT_AGENT_RUN_BUDGET = {
  recursionLimit: 25,
  maxModelCalls: 16,
  maxTotalTokens: 64_000,
  maxFailures: 4,
  maxOutputTokensPerModelCall: 4096,
  timeoutMs: 120_000
} as const

export const DEFAULT_AGENT_VERSIONS = {
  model: 'qwen3.7-max-2026-06-08',
  prompt: 'default-agent-prompt-v1',
  toolSchema: 'default-agent-tools-v1'
} as const

/** 供运行时识别默认 Chat，避免误把 Popup 的 plan Agent 套用默认策略。 */
export const DEFAULT_AGENT_GRAPH_ID = 'default_agent'
