import { ChatOpenAI } from '@langchain/openai'

export const qwenModel = new ChatOpenAI({
  model: 'qwen3.7-max-2026-06-08',
  temperature: 0,
  streaming: true
})
