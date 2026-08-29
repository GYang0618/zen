import { copilotkitMiddleware } from '@copilotkit/sdk-js/langgraph'
import { createAgent, toolErrorMiddleware } from 'langchain'

import { formatUnhandledToolError } from '@/api/tool-failure'
import { qwenModel as model } from '@/models'
import {
  GENERATIVE_UI_REPLY_RULES,
  IDENTITY_TOOL_RULES,
  ORGANIZATION_TYPE_CATALOG_RULES,
  REASONING_STYLE_RULES,
  TOOL_FAILURE_RULES
} from '@/prompts'
import { ContextSchema } from '@/schema/context'
import { agentTools } from '@/tools'

const agent = createAgent({
  model,
  tools: agentTools,
  contextSchema: ContextSchema,
  systemPrompt: [
    '你是一个智能助手，能够帮助用户完成各种任务，所有的回答一律使用简体中文回答。',
    ORGANIZATION_TYPE_CATALOG_RULES,
    IDENTITY_TOOL_RULES,
    TOOL_FAILURE_RULES,
    GENERATIVE_UI_REPLY_RULES,
    REASONING_STYLE_RULES
  ].join('\n'),
  middleware: [
    copilotkitMiddleware,
    toolErrorMiddleware({
      onError: (error, request) => formatUnhandledToolError(error, request.toolCall.name)
    })
  ]
})

export { agent }
