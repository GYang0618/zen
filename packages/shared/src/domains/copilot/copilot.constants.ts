/** LangGraph RunnableConfig.configurable 中存放当前用户 JWT 的键名 */
export const ACCESS_TOKEN_CONFIGURABLE_KEY = 'accessToken'

/** 用户明确授权发送给 Qwen 的非敏感长期记忆 */
export const AGENT_MEMORY_CONFIGURABLE_KEY = 'agentMemory'

/** 当前 AG-UI Run ID，供 Tool 幂等键与 Artifact 关联使用。 */
export const AGENT_RUN_ID_CONFIGURABLE_KEY = 'agentRunId'

/** HITL 通过后注入给 Default Agent 的短期二次确认令牌。 */
export const AGENT_STEP_UP_TOKEN_CONFIGURABLE_KEY = 'stepUpToken'

/** 对话审批通过后，与页面 step-up 令牌同等有效的时间窗。 */
export const AGENT_HITL_STEP_UP_WINDOW_MS = 3 * 60 * 1_000

/** 当前租户允许 Default Agent 暴露 Tool 的 ACTIVE 插件 ID。 */
export const ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY = 'activeAgentPlugins'

/**
 * Default Agent 的运行预算。远程 LangGraph 使用 snake_case 的 recursion_limit。
 *
 * `recursionLimit` 计的是 Pregel 节点访问，不是模型调用次数。当前图每轮约 7 个节点
 *（2×before_model + model_request + 3×after_model + tools），首轮另有 before_agent。
 * 按 maxModelCalls 估算：8 + 7×(maxModelCalls-1) ≈ 113，取 128。
 * `maxTotalTokens` 是整轮累计用量，不是单次上下文窗口。
 * `timeoutMs` 是无事件空闲超时，有流式事件会续期；人工审批期间不计时。
 */
export const DEFAULT_AGENT_RUN_BUDGET = {
  recursionLimit: 128,
  maxModelCalls: 16,
  maxTotalTokens: 256_000,
  maxFailures: 4,
  maxOutputTokensPerModelCall: 4096,
  timeoutMs: 180_000
} as const

export const DEFAULT_AGENT_VERSIONS = {
  model: 'qwen3.7-max-2026-06-08',
  prompt: 'default-agent-prompt-v1',
  toolSchema: 'default-agent-tools-v1'
} as const

/** 供运行时识别默认 Chat，避免误把 Popup 的 plan Agent 套用默认策略。 */
export const DEFAULT_AGENT_GRAPH_ID = 'default_agent'
