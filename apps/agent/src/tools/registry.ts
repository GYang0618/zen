import { PLUGIN_AGENT_TOOL_FACTORIES } from '@zen/plugin-registry/agent'
import { tool } from 'langchain'

import { asSdkOptions, executeApiCall, noteControllerList } from '../api'
import { getToolExecutionPolicy } from '../tool-policy'
import { organizationTools } from './organization'
import { postTools } from './post'
import { roleTools } from './role'
import { userTools } from './user'

import type { RunnableConfig } from '@langchain/core/runnables'

const rawPluginProviders = PLUGIN_AGENT_TOOL_FACTORIES.map((entry) => ({
  id: `plugin:${entry.pluginId}`,
  tools: entry.factory({
    createTool: (handler, definition) => tool(handler, definition),
    callApi: callPluginApi
  })
}))

type RegisteredTool =
  | (typeof userTools)[number]
  | (typeof roleTools)[number]
  | (typeof organizationTools)[number]
  | (typeof postTools)[number]
  | (typeof rawPluginProviders)[number]['tools'][number]

export interface AgentToolProvider {
  id: string
  tools: readonly RegisteredTool[]
}

export interface AgentToolDescriptor {
  name: string
  inputSchema: unknown
  permissionCode?: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  sideEffect: 'none' | 'write' | 'destructive'
  requiresApproval: boolean
  timeoutMs: number
  retryPolicy: { maxRetries: number; retryableReasons: readonly string[] }
  idempotencyPolicy: 'none' | 'run-tool-call'
  pluginId?: string
}

const coreProviders: readonly AgentToolProvider[] = [
  { id: 'core:user', tools: userTools },
  { id: 'core:role', tools: roleTools },
  { id: 'core:organization', tools: organizationTools },
  { id: 'core:post', tools: postTools }
]

const pluginProviders: readonly AgentToolProvider[] = rawPluginProviders

/** Default Agent 的唯一 Tool 聚合边界；插件通过编译期 provider 注入。 */
export function createAgentToolRegistry(
  providers: readonly AgentToolProvider[] = [...coreProviders, ...pluginProviders]
): RegisteredTool[] {
  const tools = new Map<string, RegisteredTool>()

  for (const provider of providers) {
    for (const tool of provider.tools) {
      if (tools.has(tool.name)) {
        throw new Error(`Duplicate agent tool name: ${tool.name} (${provider.id})`)
      }
      tools.set(tool.name, tool)
    }
  }

  return [...tools.values()]
}

export const defaultAgentTools = createAgentToolRegistry()

export const defaultAgentToolDescriptors: readonly AgentToolDescriptor[] = defaultAgentTools.map(
  (registeredTool) => {
    const policy = getToolExecutionPolicy(registeredTool.name)
    if (!policy) throw new Error(`Missing execution policy for agent tool: ${registeredTool.name}`)
    return { name: registeredTool.name, inputSchema: registeredTool.schema, ...policy }
  }
)

const pluginIdByToolName = new Map(
  defaultAgentToolDescriptors.flatMap((descriptor) =>
    descriptor.pluginId ? [[descriptor.name, descriptor.pluginId] as const] : []
  )
)

export function getAgentToolPluginId(toolName: string): string | undefined {
  return pluginIdByToolName.get(toolName)
}

export function getActivePluginAgentPrompts(activePluginIds: readonly string[]): string[] {
  const active = new Set(activePluginIds)
  return PLUGIN_AGENT_TOOL_FACTORIES.filter((entry) => active.has(entry.pluginId)).flatMap(
    (entry) => [...entry.agentPrompts]
  )
}

async function callPluginApi(
  operationId: string,
  options: unknown,
  config: RunnableConfig
): Promise<string> {
  if (operationId === 'noteControllerList') {
    const sdkOptions =
      options === undefined
        ? undefined
        : asSdkOptions<NonNullable<Parameters<typeof noteControllerList>[0]>>(options as object)
    return executeApiCall(config, () => noteControllerList(sdkOptions))
  }
  throw new Error(`Unsupported plugin OpenAPI operation: ${operationId}`)
}
