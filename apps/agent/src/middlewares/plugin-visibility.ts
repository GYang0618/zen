import { ACTIVE_AGENT_PLUGINS_CONFIGURABLE_KEY } from '@zen/shared'
import { createMiddleware, ToolMessage } from 'langchain'

import { ContextSchema } from '@/schema/context'
import { getAgentToolPluginId } from '@/tools'

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
          code: 503,
          reason: 'TOOL_UNAVAILABLE',
          message: `插件 ${pluginId} 未启用，该工具不可用。`,
          path: '',
          traceId: 'agent-local',
          timestamp: new Date().toISOString(),
          error: null,
          fieldErrors: null,
          formErrors: null
        }),
        tool_call_id: request.toolCall.id ?? `disabled:${request.toolCall.name}`
      })
    }
    return handler(request)
  }
})
