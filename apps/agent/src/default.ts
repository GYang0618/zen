import { copilotkitMiddleware } from '@copilotkit/sdk-js/langgraph'
import {
  ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY,
  AGENT_MEMORY_CONFIGURABLE_KEY,
  DEFAULT_AGENT_RUN_BUDGET
} from '@zen/shared'
import { createAgent, dynamicSystemPromptMiddleware } from 'langchain'

import { createDefaultAgentMiddleware } from '@/middleware'
import { createQwenModel } from '@/models'
import {
  APPROVAL_FLOW_RULES,
  GENERATIVE_UI_REPLY_RULES,
  IDENTITY_TOOL_RULES,
  ORGANIZATION_TYPE_CATALOG_RULES,
  REASONING_STYLE_RULES,
  TOOL_FAILURE_RULES
} from '@/prompts'
import { ContextSchema } from '@/schema/context'
import { defaultAgentTools, getActivePluginAgentPrompts } from '@/tools'

import type { z } from 'zod'

const BASE_SYSTEM_PROMPT = [
  '你是一个智能助手，能够帮助用户完成各种任务，所有的回答一律使用简体中文回答。',
  ORGANIZATION_TYPE_CATALOG_RULES,
  IDENTITY_TOOL_RULES,
  TOOL_FAILURE_RULES,
  APPROVAL_FLOW_RULES,
  GENERATIVE_UI_REPLY_RULES,
  REASONING_STYLE_RULES
].join('\n')

const model = createQwenModel({
  maxTokens: DEFAULT_AGENT_RUN_BUDGET.maxOutputTokensPerModelCall
})

const agent = createAgent({
  model,
  tools: defaultAgentTools,
  contextSchema: ContextSchema,
  middleware: [
    copilotkitMiddleware,
    dynamicSystemPromptMiddleware<z.infer<typeof ContextSchema>>((_state, runtime) => {
      const memory = runtime.context?.[AGENT_MEMORY_CONFIGURABLE_KEY]
      const activePluginIds = runtime.context?.[ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY] ?? []
      const pluginPrompts = getActivePluginAgentPrompts(activePluginIds)
      return [
        BASE_SYSTEM_PROMPT,
        ...(pluginPrompts.length ? [`当前启用的插件指令：\n${pluginPrompts.join('\n')}`] : []),
        ...(memory ? [`用户明确授权给 Qwen 的非敏感记忆：\n${memory}`] : [])
      ].join('\n\n')
    }),
    // 默认中间件链条包含：toolErrorMiddleware, humanInTheLoopMiddleware, summarizationMiddleware, pluginToolVisibilityMiddleware
    ...createDefaultAgentMiddleware(model)
  ]
})

export { agent }
