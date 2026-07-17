import { ChatOpenAI } from '@langchain/openai'

export const qwenModel = new ChatOpenAI({
  model: 'kimi-k2.6',
  temperature: 0,
  streaming: true
})
