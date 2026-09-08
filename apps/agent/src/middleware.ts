import { ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY, DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'
import {
  ClearToolUsesEdit,
  contextEditingMiddleware,
  createMiddleware,
  humanInTheLoopMiddleware,
  modelCallLimitMiddleware,
  summarizationMiddleware,
  ToolMessage,
  toolErrorMiddleware
} from 'langchain'

import { formatUnhandledToolError } from '@/api/tool-failure'
import { ContextSchema } from '@/schema/context'
import {
  collectConversationHints,
  resolveToolCapabilities,
  selectToolNamesForCapabilities
} from '@/tool-domains'
import { createApprovalPolicy } from '@/tool-policy'
import { defaultAgentToolDescriptors, getAgentToolPluginId } from '@/tools'

import type { createQwenModel } from '@/models'

export const pluginToolVisibilityMiddleware = createMiddleware({
  name: 'pluginToolVisibility',
  contextSchema: ContextSchema,
  wrapModelCall: (request, handler) => {
    const activePluginIds = request.runtime.context?.[ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY] ?? []
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
    const activePluginIds = request.runtime.context?.[ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY] ?? []
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

/** 按用户话和最近 Tool 同步裁剪工具表，不额外打模型。 */
export const domainToolFilterMiddleware = createMiddleware({
  name: 'domainToolFilter',
  wrapModelCall: (request, handler) => {
    const getToolName = (toolItem: unknown): string | undefined => {
      if (!toolItem || typeof toolItem !== 'object') return undefined
      if ('name' in toolItem && typeof (toolItem as { name?: unknown }).name === 'string') {
        return (toolItem as { name: string }).name
      }
      if (
        'function' in toolItem &&
        typeof (toolItem as { function?: { name?: unknown } }).function?.name === 'string'
      ) {
        return (toolItem as { function: { name: string } }).function.name
      }
      return undefined
    }

    const availableNames = request.tools.flatMap((registeredTool) => {
      const name = getToolName(registeredTool)
      return name ? [name] : []
    })
    const hints = collectConversationHints(request.messages)
    const selected = selectToolNamesForCapabilities(
      availableNames,
      resolveToolCapabilities(hints.text, hints.recentToolNames)
    )
    if (!selected) return handler(request)
    const allowed = new Set(selected)
    const registeredBackendNames = new Set(defaultAgentToolDescriptors.map((item) => item.name))

    return handler({
      ...request,
      tools: request.tools.filter((registeredTool) => {
        const name = getToolName(registeredTool)
        // 动态注入的前端工具或未在服务端清单注册的工具一律放行，不被服务端领域规则裁剪
        if (!name || !registeredBackendNames.has(name)) return true
        return allowed.has(name)
      })
    })
  }
})

export function createDefaultAgentMiddleware(model: ReturnType<typeof createQwenModel>) {
  return [
    pluginToolVisibilityMiddleware,
    domainToolFilterMiddleware,
    modelCallLimitMiddleware({
      runLimit: DEFAULT_AGENT_RUN_BUDGET.maxModelCalls,
      exitBehavior: 'error'
    }),
    humanInTheLoopMiddleware({
      interruptOn: createApprovalPolicy(),
      descriptionPrefix: 'Default Agent 请求执行高风险操作'
    }),
    contextEditingMiddleware({
      edits: [
        new ClearToolUsesEdit({
          trigger: { tokens: 48_000 },
          keep: { messages: 3 },
          placeholder: '[cleared]'
        })
      ]
    }),
    summarizationMiddleware({
      model,
      trigger: [{ tokens: 80_000 }, { messages: 24 }],
      keep: { messages: 8 },
      summaryPrefix: '此前对话摘要：'
    }),
    toolErrorMiddleware({
      onError: (error, request) => formatUnhandledToolError(error, request.toolCall.name)
    })
  ]
}
