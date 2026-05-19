import { copilotkitMiddleware } from '@copilotkit/sdk-js/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { createAgent } from 'langchain'

/** DashScope Qwen 需关闭 thinking，否则 tool calling 会 400 */
const model = new ChatOpenAI({
  model: 'qwen3.5-27b',
  temperature: 0,
  modelKwargs: { enable_thinking: false }
})

const agent = createAgent({
  model,
  systemPrompt: '你是一个智能助手，请根据用户的问题给出回答（使用中文回答）。',
  middleware: [copilotkitMiddleware]
})

/** LangGraph CLI 从 langgraph.json 的 `:graph` 符号加载 */
export { agent }
