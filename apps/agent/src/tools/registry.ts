import { PLUGIN_AGENT_TOOL_FACTORIES } from '@zen/plugin-registry/agent'
import { toolManifestSchema } from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import { asSdkOptions, executeApiCall, noteControllerList } from '../api'
import { getToolExecutionPolicy } from '../tool-policy'
import { organizationTools } from './organization'
import { postTools } from './post'
import { roleTools } from './role'
import { userTools } from './user'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { ToolManifest } from '@zen/shared'

const rawPluginProviders = PLUGIN_AGENT_TOOL_FACTORIES.map((entry) => ({
  id: `plugin:${entry.pluginId}`,
  tools: entry.factory({
    createTool: (handler, definition) => {
      const manifest = entry.manifests.find((item) => item.name === definition.name)
      if (!manifest) throw new Error(`Plugin tool lacks manifest: ${definition.name}`)
      toolManifestSchema.parse(manifest)
      return tool(handler, { ...definition, description: manifest.description })
    },
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

export type AgentToolDescriptor = ToolManifest

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
    const pluginManifest = PLUGIN_AGENT_TOOL_FACTORIES.flatMap((entry) => entry.manifests).find(
      (manifest) => manifest.name === registeredTool.name
    )
    if (pluginManifest) return toolManifestSchema.parse(pluginManifest)
    const domain =
      coreProviders
        .find((provider) => provider.tools.some((tool) => tool.name === registeredTool.name))
        ?.id.split(':')[1] ?? 'general'
    return toolManifestSchema.parse({
      name: registeredTool.name,
      version: '1.0.0',
      description: registeredTool.description,
      inputSchema: z.toJSONSchema(registeredTool.schema),
      capabilities: [domain, policy.sideEffect === 'none' ? 'read' : 'write'],
      ui: { label: registeredTool.name },
      ...policy
    })
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
    return executeApiCall(config, async (_context) => noteControllerList(sdkOptions))
  }
  throw new Error(`Unsupported plugin OpenAPI operation: ${operationId}`)
}
