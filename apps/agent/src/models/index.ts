import { ChatOpenAI } from '@langchain/openai'

export const qwenModel = new ChatOpenAI({
  model: 'qwen3.6-plus',
  temperature: 0,
  streaming: true
})
