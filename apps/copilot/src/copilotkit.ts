import { BuiltInAgent, CopilotRuntime, createCopilotHonoHandler } from '@copilotkit/runtime/v2'

import { LangGraphAgent } from './langgraph/agent'

const agent = new LangGraphAgent({
  deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL ?? 'http://localhost:2024',
  graphId: process.env.LANGGRAPH_GRAPH_ID ?? 'langchain_agent'
})

const builtInAgent = new BuiltInAgent({
  model: 'openai/qwen3.5-27b',
  maxSteps: 5,
  prompt: '你是一个智能助手，请根据用户的问题给出回答（使用中文回答）。'
})

const runtime = new CopilotRuntime({
  agents: {
    default: agent,
    builtInAgent
  }
})

const app = createCopilotHonoHandler({
  runtime,
  basePath: '/'
})

export default app
