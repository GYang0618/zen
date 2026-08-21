import { registerConfig } from '../helper'

/**
 * LangGraph / Copilot 运行时配置
 */
export const langgraphConfig = registerConfig('langgraph', (env) => ({
  /** LangGraph 部署地址 */
  deploymentUrl: env.LANGGRAPH_DEPLOYMENT_URL
}))
