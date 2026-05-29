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
    '你是一个智能助手，能够帮助用户完成各种任务，所有的回答一律使用简体中文回答。',
    GENERATIVE_UI_REPLY_RULES
  ].join('\n'),
  middleware: [copilotkitMiddleware]
})

export { agent }
