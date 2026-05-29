import { ChatOpenAI } from '@langchain/openai'

export const qwenModel = new ChatOpenAI({
  model: 'qwen3.6-35b-a3b',
  temperature: 0,
  streaming: true
})
