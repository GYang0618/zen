import { AIMessage, ToolMessage } from '@langchain/core/messages'
import { createMiddleware } from 'langchain'
import { z } from 'zod'

import type { BaseMessage } from '@langchain/core/messages'

const flexibleToolSchema = z.union([
  z.object({
    type: z.literal('function'),
    function: z.object({
      name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_-]*$/),
      description: z.string().default(''),
      parameters: z.record(z.string(), z.unknown()).default({})
    })
  }),
  z
    .object({
      name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_-]*$/),
      description: z.string().optional().default(''),
      parameters: z.record(z.string(), z.unknown()).optional().default({})
    })
    .transform((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description ?? '',
        parameters: tool.parameters ?? {}
      }
    }))
])

const contextItemSchema = z.object({
  description: z.string(),
  value: z.string()
})

export const frontendStateSchema = z.object({
  'ag-ui': z
    .object({
      tools: z.array(flexibleToolSchema).default([]),
      context: z.array(contextItemSchema).default([])
    })
    .prefault({ tools: [], context: [] }),
  copilotkit: z
    .object({
      actions: z.array(flexibleToolSchema).optional().default([]),
      context: z.array(contextItemSchema).optional().default([])
    })
    .optional()
})

export function extractFrontendTools(state: unknown) {
  const parsed = frontendStateSchema.safeParse(state)
  if (!parsed.success) return []
  const data = parsed.data
  const aguiTools = data['ag-ui']?.tools ?? []
  const copilotkitActions = data.copilotkit?.actions ?? []
  const all = [...aguiTools, ...copilotkitActions]
  const deduped = new Map<string, (typeof all)[number]>()
  for (const t of all) {
    if (!deduped.has(t.function.name)) {
      deduped.set(t.function.name, t)
    }
  }
  return Array.from(deduped.values())
}

export function extractFrontendContext(state: unknown) {
  const parsed = frontendStateSchema.safeParse(state)
  if (!parsed.success) return []
  const data = parsed.data
  const aguiContext = data['ag-ui']?.context ?? []
  const copilotkitContext = data.copilotkit?.context ?? []
  return [...aguiContext, ...copilotkitContext]
}

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
      const frontendTools = extractFrontendTools(request.state)
      const frontendContext = extractFrontendContext(request.state)
      const names = new Set<string>()
      for (const tool of frontendTools) {
        if (reservedNames.has(tool.function.name) || names.has(tool.function.name)) {
          throw new Error(
            `Frontend tool name conflicts with a registered tool: ${tool.function.name}`
          )
        }
        names.add(tool.function.name)
      }
      return handler({
        ...request,
        tools: [...request.tools, ...frontendTools],
        systemMessage: frontendContext.length
          ? request.systemMessage.concat(
              `\nApplication context:\n${JSON.stringify(frontendContext)}`
            )
          : request.systemMessage
      })
    },
    beforeModel: {
      canJumpTo: ['tools', 'end'],
      hook: (state) => {
        const pending = pendingToolCalls(state.messages)
        const frontendNames = new Set(extractFrontendTools(state).map((tool) => tool.function.name))
        if (pending.some((call) => frontendNames.has(call.name))) return { jumpTo: 'end' }
        // Mixed frontend/backend calls resume unfinished backend work only after browser results arrive.
        if (pending.some((call) => reservedNames.has(call.name))) return { jumpTo: 'tools' }
      }
    },
    afterModel: {
      canJumpTo: ['end'],
      hook: (state) => {
        const frontendNames = new Set(extractFrontendTools(state).map((tool) => tool.function.name))
        if (pendingToolCalls(state.messages).some((call) => frontendNames.has(call.name))) {
          return { jumpTo: 'end' }
        }
      }
    }
  })
}
