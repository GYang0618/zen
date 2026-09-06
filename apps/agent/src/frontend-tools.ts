import { AIMessage, ToolMessage } from '@langchain/core/messages'
import { createMiddleware } from 'langchain'
import { z } from 'zod'

import type { BaseMessage } from '@langchain/core/messages'

const frontendToolSchema = z.object({
  type: z.literal('function'),
  function: z.object({
    name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_-]*$/),
    description: z.string(),
    parameters: z.record(z.string(), z.unknown())
  })
})

export const frontendStateSchema = z.object({
  'ag-ui': z
    .object({
      tools: z.array(frontendToolSchema).default([]),
      context: z.array(z.object({ description: z.string(), value: z.string() })).default([])
    })
    .prefault({})
})

function pendingToolCalls(messages: BaseMessage[]) {
  const lastAssistantIndex = messages.findLastIndex((message) => AIMessage.isInstance(message))
  const assistant = messages[lastAssistantIndex]
  if (!assistant || !AIMessage.isInstance(assistant)) return []
  const answered = new Set(
    messages
      .slice(lastAssistantIndex + 1)
      .filter(ToolMessage.isInstance)
      .map((message) => message.tool_call_id)
  )
  return (assistant.tool_calls ?? []).filter((call) => !call.id || !answered.has(call.id))
}

/** AG-UI frontend calls end this invocation; the browser supplies their results on the next run. */
export function createFrontendToolsMiddleware(serverToolNames: readonly string[]) {
  const reservedNames = new Set(serverToolNames)
  return createMiddleware({
    name: 'agUiFrontendTools',
    stateSchema: frontendStateSchema,
    wrapModelCall: (request, handler) => {
      const frontend = frontendStateSchema.parse(request.state)['ag-ui']
      const names = new Set<string>()
      for (const tool of frontend.tools) {
        if (reservedNames.has(tool.function.name) || names.has(tool.function.name)) {
          throw new Error(
            `Frontend tool name conflicts with a registered tool: ${tool.function.name}`
          )
        }
        names.add(tool.function.name)
      }
      return handler({
        ...request,
        tools: [...request.tools, ...frontend.tools],
        systemMessage: frontend.context.length
          ? request.systemMessage.concat(
              `\nApplication context:\n${JSON.stringify(frontend.context)}`
            )
          : request.systemMessage
      })
    },
    beforeModel: {
      canJumpTo: ['tools', 'end'],
      hook: (state) => {
        const pending = pendingToolCalls(state.messages)
        const frontendNames = new Set(state['ag-ui'].tools.map((tool) => tool.function.name))
        if (pending.some((call) => frontendNames.has(call.name))) return { jumpTo: 'end' }
        // Mixed frontend/backend calls resume unfinished backend work only after browser results arrive.
        if (pending.some((call) => reservedNames.has(call.name))) return { jumpTo: 'tools' }
      }
    },
    afterModel: {
      canJumpTo: ['end'],
      hook: (state) => {
        const frontendNames = new Set(state['ag-ui'].tools.map((tool) => tool.function.name))
        if (pendingToolCalls(state.messages).some((call) => frontendNames.has(call.name))) {
          return { jumpTo: 'end' }
        }
      }
    }
  })
}
