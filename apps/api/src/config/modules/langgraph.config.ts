import { registerConfig } from '../helper.js'

/**
 * LangGraph / Copilot 运行时配置
 */
export const langgraphConfig = registerConfig('langgraph', (env) => ({
  /** LangGraph 部署地址 */
  deploymentUrl: env.LANGGRAPH_DEPLOYMENT_URL,
  /** CopilotKit Intelligence API Key */
  intelligenceApiKey: env.COPILOTKIT_INTELLIGENCE_API_KEY,
  /** CopilotKit Intelligence API URL */
  intelligenceApiUrl: env.COPILOTKIT_INTELLIGENCE_API_URL,
  /** CopilotKit Intelligence WebSocket URL */
  intelligenceWsUrl: env.COPILOTKIT_INTELLIGENCE_WS_URL
}))
