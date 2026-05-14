import { BuiltInAgent, CopilotRuntime, createCopilotHonoHandler } from '@copilotkit/runtime/v2'

const builtInAgent = new BuiltInAgent({
  model: 'openai/qwen3.5-plus',
  maxSteps: 5,
  prompt: '你是一个智能助手，请根据用户的问题给出回答（使用中文回答）。'
})

const runtime = new CopilotRuntime({
  agents: {
    default: builtInAgent
  }
})

const app = createCopilotHonoHandler({
  runtime,
  basePath: '/'
})

export default app
