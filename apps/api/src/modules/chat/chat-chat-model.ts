import { ChatOpenAI } from '@langchain/openai'

/**
 * DashScope 兼容模式下，部分 Qwen 模型默认处于 thinking 模式；
 * 该模式下不允许 LangChain Agent 使用的 `tool_choice: required`/结构化工具选择，
 * 会导致 400 InvalidParameter。参见：https://help.aliyun.com/zh/model-studio/
 */
const QWEN_DASHSCOPE_MODEL_KWARGS = {
  enable_thinking: false
} as const

const CHAT_MODEL_FIELDS = {
  model: 'qwen3.5-27b',
  temperature: 0,
  modelKwargs: QWEN_DASHSCOPE_MODEL_KWARGS
} satisfies ConstructorParameters<typeof ChatOpenAI>[0]

/** Chat 使用的对话模型（当前链路假设经由 DashScope OpenAI 兼容端点）。 */
export function createChatOpenAI(): ChatOpenAI {
  return new ChatOpenAI(CHAT_MODEL_FIELDS)
}
