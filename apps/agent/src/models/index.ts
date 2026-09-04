import { ChatOpenAI } from '@langchain/openai'

type QwenModelOptions = ConstructorParameters<typeof ChatOpenAI>[0]

export function createQwenModel(options: QwenModelOptions = {}) {
  return new ChatOpenAI({
    model: 'qwen3.7-flash',
    temperature: 0,
    streaming: true,
    ...options
  })
}

/** Popup/plan Agent 的既有模型实例，保持其运行参数不变。 */
export const qwenModel = createQwenModel()
