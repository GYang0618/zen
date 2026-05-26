import { copilotkitMiddleware } from '@copilotkit/sdk-js/langgraph'
import { createDeepAgent } from 'deepagents'

import { qwenModel as model } from '@/models'

const agent = createDeepAgent({
  model,
  tools: [],
  systemPrompt:
    '你是一个智能助手，请根据用户的问题给出回答，一律使用中文回答。' +
    '当需要查询或管理用户账号时，请使用提供的用户相关工具，并依据工具返回的 JSON 结果作答。',
  middleware: [copilotkitMiddleware]
})

export { agent }
