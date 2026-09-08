/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import { createDemoNotesAgentTools } from '@zen/plugin-demo-notes/agent'

export const PLUGIN_AGENT_TOOL_FACTORIES = [
  {
    pluginId: 'demo-notes' as const,
    factory: createDemoNotesAgentTools,
    manifests: [
      {
        permissionCode: 'demo:note:list',
        riskLevel: 'low',
        sideEffect: 'none',
        requiresApproval: false,
        timeoutMs: 15000,
        retryPolicy: {
          maxRetries: 2,
          retryableReasons: ['NETWORK_ERROR', 'RATE_LIMITED', 'TIMEOUT']
        },
        idempotencyPolicy: 'none',
        pluginId: 'demo-notes',
        name: 'list_demo_notes',
        version: '1.0.0',
        description: 'List notes visible to the current user',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        capabilities: ['notes', 'read'],
        ui: { label: 'List notes', icon: 'sticky-note' }
      }
    ] as const,
    requiredPermissions: ['demo:note:list'] as readonly string[],
    agentPrompts: [
      'Only use demo note tools when the demo-notes plugin is active.'
    ] as readonly string[]
  }
] as const
