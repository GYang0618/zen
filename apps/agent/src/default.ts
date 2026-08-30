import { copilotkitMiddleware } from '@copilotkit/sdk-js/langgraph'
import {
  ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY,
  AGENT_MEMORY_CONFIGURABLE_KEY,
  DEFAULT_AGENT_RUN_BUDGET
} from '@zen/shared'
import {
  createAgent,
  createMiddleware,
  dynamicSystemPromptMiddleware,
  humanInTheLoopMiddleware,
  modelCallLimitMiddleware,
  summarizationMiddleware,
  ToolMessage,
  toolErrorMiddleware
} from 'langchain'

import { formatUnhandledToolError } from '@/api/tool-failure'
import { createQwenModel } from '@/models'
import {
  GENERATIVE_UI_REPLY_RULES,
  IDENTITY_TOOL_RULES,
  ORGANIZATION_TYPE_CATALOG_RULES,
  REASONING_STYLE_RULES,
  TOOL_FAILURE_RULES
} from '@/prompts'
import { ContextSchema } from '@/schema/context'
import { createApprovalPolicy } from '@/tool-policy'
import {
  defaultAgentTools,
  getActivePluginAgentPrompts,
  getAgentToolPluginId
} from '@/tools'

import type { z } from 'zod'

const BASE_SYSTEM_PROMPT = [
  '你是一个智能助手，能够帮助用户完成各种任务，所有的回答一律使用简体中文回答。',
  ORGANIZATION_TYPE_CATALOG_RULES,
  IDENTITY_TOOL_RULES,
  TOOL_FAILURE_RULES,
  GENERATIVE_UI_REPLY_RULES,
  REASONING_STYLE_RULES
].join('\n')

const model = createQwenModel({
  maxTokens: DEFAULT_AGENT_RUN_BUDGET.maxOutputTokensPerModelCall
})

const pluginToolVisibilityMiddleware = createMiddleware({
  name: 'pluginToolVisibility',
  contextSchema: ContextSchema,
  wrapModelCall: (request, handler) => {
    const activePluginIds =
      request.runtime.context?.[ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY] ?? []
    const active = new Set(activePluginIds)
    return handler({
      ...request,
      tools: request.tools.filter((registeredTool) => {
        const pluginId =
          typeof registeredTool.name === 'string'
            ? getAgentToolPluginId(registeredTool.name)
            : undefined
        return pluginId === undefined || active.has(pluginId)
      })
    })
  },
  wrapToolCall: (request, handler) => {
    const pluginId = getAgentToolPluginId(request.toolCall.name)
    const activePluginIds =
      request.runtime.context?.[ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY] ?? []
    if (pluginId && !activePluginIds.includes(pluginId)) {
      return new ToolMessage({
        content: JSON.stringify({
          success: false,
          reason: 'TOOL_UNAVAILABLE',
          message: `插件 ${pluginId} 未启用，该工具不可用。`
        }),
        tool_call_id: request.toolCall.id ?? `disabled:${request.toolCall.name}`
      })
    }
    return handler(request)
  }
})

const agent = createAgent({
  model,
  tools: defaultAgentTools,
  contextSchema: ContextSchema,
  middleware: [
    copilotkitMiddleware,
    dynamicSystemPromptMiddleware<z.infer<typeof ContextSchema>>((_state, runtime) => {
      const memory = runtime.context?.[AGENT_MEMORY_CONFIGURABLE_KEY]
      const activePluginIds =
        runtime.context?.[ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY] ?? []
      const pluginPrompts = getActivePluginAgentPrompts(activePluginIds)
      return [
        BASE_SYSTEM_PROMPT,
        ...(pluginPrompts.length ? [`当前启用的插件指令：\n${pluginPrompts.join('\n')}`] : []),
        ...(memory ? [`用户明确授权给 Qwen 的非敏感记忆：\n${memory}`] : [])
      ].join('\n\n')
    }),
    pluginToolVisibilityMiddleware,
    modelCallLimitMiddleware({
      runLimit: DEFAULT_AGENT_RUN_BUDGET.maxModelCalls,
      exitBehavior: 'error'
    }),
    humanInTheLoopMiddleware({
      interruptOn: createApprovalPolicy(),
      descriptionPrefix: 'Default Agent 请求执行高风险操作'
    }),
    summarizationMiddleware({
      model,
      trigger: { messages: 24 },
      keep: { messages: 8 },
      summaryPrefix: '此前对话摘要：'
    }),
    toolErrorMiddleware({
      onError: (error, request) => formatUnhandledToolError(error, request.toolCall.name)
    })
  ]
})

export { agent }
