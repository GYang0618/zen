import { copilotkitMiddleware } from '@copilotkit/sdk-js/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { createAgent } from 'langchain'

const model = new ChatOpenAI({
  model: 'qwen3.5-27b',
  temperature: 0,
  streaming: true
})

const agent = createAgent({
  model,
  systemPrompt: '你是一个智能助手，请根据用户的问题给出回答（使用中文回答）。',
  middleware: [copilotkitMiddleware]
})

export { agent }
