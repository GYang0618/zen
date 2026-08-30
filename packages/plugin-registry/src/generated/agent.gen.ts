/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import { createDemoNotesAgentTools } from '@zen/plugin-demo-notes/agent'

export const PLUGIN_AGENT_TOOL_FACTORIES = [
  {
    pluginId: 'demo-notes' as const,
    factory: createDemoNotesAgentTools,
    requiredPermissions: ["demo:note:list"] as readonly string[],
    agentPrompts: ["Only use demo note tools when the demo-notes plugin is active."] as readonly string[]
  }
] as const

