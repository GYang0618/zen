import { copilotkitMiddleware } from '@copilotkit/sdk-js/langgraph'
import { createAgent } from 'langchain'

import { qwenModel as model } from '@/models'
import { GENERATIVE_UI_REPLY_RULES } from '@/prompts'
import { ContextSchema } from '@/schema/context'
import { agentTools } from '@/tools'

const agent = createAgent({
  model,
  tools: agentTools,
  contextSchema: ContextSchema,
  systemPrompt: [
    '你是一个智能助手，请根据用户的问题给出回答，一律使用中文回答。',
    '当需要查询或管理用户账号时，请使用提供的用户相关工具。',
    '工具返回的 JSON 仅供你理解执行结果；用户看到的详细数据由前端 UI 展示。',
    GENERATIVE_UI_REPLY_RULES
  ].join('\n'),
  middleware: [copilotkitMiddleware]
})

export { agent }
