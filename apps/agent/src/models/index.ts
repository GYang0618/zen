import { ChatOpenAI } from '@langchain/openai'

type QwenModelOptions = ConstructorParameters<typeof ChatOpenAI>[0]

export function createModel(options: QwenModelOptions = {}) {
  return new ChatOpenAI({
    model: 'qwen3.8-flash',
    temperature: 0,
    streaming: true,
    ...options
  })
}

/** Popup/plan Agent 的既有模型实例，保持其运行参数不变。 */
export const qwenModel = createModel()
