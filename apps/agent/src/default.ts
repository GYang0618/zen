import {
  ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY,
  AGENT_MEMORY_CONFIGURABLE_KEY,
  DEFAULT_AGENT_RUN_BUDGET
} from '@zen/shared'
import { createAgent, dynamicSystemPromptMiddleware } from 'langchain'

import {
  createDefaultAgentMiddleware,
  createFrontendToolsMiddleware,
  userStateSyncMiddleware
} from '@/middlewares'
import { createModel } from '@/models'
import {
  APPROVAL_FLOW_RULES,
  ARTIFACT_RULES,
  GENERATIVE_UI_REPLY_RULES,
  IDENTITY_TOOL_RULES,
  ORGANIZATION_TYPE_CATALOG_RULES,
  REASONING_STYLE_RULES,
  TOOL_FAILURE_RULES
} from '@/prompts'
import { ContextSchema } from '@/schema/context'
import { AgentStateSchema } from '@/schema/state'
import { defaultAgentTools, getActivePluginAgentPrompts } from '@/tools'

import type { z } from 'zod'

const BASE_SYSTEM_PROMPT = [
  '你是一个智能助手，能够帮助用户完成各种任务，所有的回答一律使用简体中文回答。',
  ORGANIZATION_TYPE_CATALOG_RULES,
  IDENTITY_TOOL_RULES,
  TOOL_FAILURE_RULES,
  APPROVAL_FLOW_RULES,
  ARTIFACT_RULES,
  GENERATIVE_UI_REPLY_RULES,
  REASONING_STYLE_RULES
].join('\n\n')

/** 图工厂：每次创建新实例，禁止把请求级可变状态挂在模块单例上。 */
export function createDefaultAgent() {
  const model = createModel({
    maxTokens: DEFAULT_AGENT_RUN_BUDGET.maxOutputTokensPerModelCall
  })

  return createAgent({
    model,
    tools: defaultAgentTools,
    stateSchema: AgentStateSchema,
    contextSchema: ContextSchema,
    middleware: [
      dynamicSystemPromptMiddleware<z.infer<typeof ContextSchema>>((_state, runtime) => {
        const memory = runtime.context?.[AGENT_MEMORY_CONFIGURABLE_KEY]
        const activePluginIds = runtime.context?.[ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY] ?? []
        const pluginPrompts = getActivePluginAgentPrompts(activePluginIds)
        const now = new Date()
        const timePrompt = `当前系统时间：${now.toISOString()}（北京时间：${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}）`
        return [
          BASE_SYSTEM_PROMPT,
          timePrompt,
          ...(pluginPrompts.length ? [`当前启用的插件指令：\n${pluginPrompts.join('\n')}`] : []),
          ...(memory ? [`用户明确授权给 Qwen 的非敏感记忆：\n${memory}`] : [])
        ].join('\n\n')
      }),
      createFrontendToolsMiddleware(defaultAgentTools.map((tool) => tool.name)),
      userStateSyncMiddleware,
      ...createDefaultAgentMiddleware(model)
    ]
  })
}

/** LangGraph CLI 入口仍导出编译图；请求状态走 configurable/context。 */
export const agent = createDefaultAgent()
