import { ChatOpenAI } from '@langchain/openai'

export const qwenModel = new ChatOpenAI({
  model: 'qwen3.6-plus-2026-04-02',
  temperature: 0,
  streaming: true
})
