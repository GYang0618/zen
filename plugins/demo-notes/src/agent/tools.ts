import { z } from 'zod'

import type { PluginAgentToolHost } from '@zen/plugin-sdk'

const emptyInputSchema = z.object({})

/**
 * 可执行的插件 Tool 工厂。宿主注入 OpenAPI SDK 执行器，插件不直连业务库。
 */
export function createDemoNotesAgentTools<TTool, TConfig>(
  host: PluginAgentToolHost<TTool, TConfig, Record<string, never>, typeof emptyInputSchema>
): TTool[] {
  return [
    host.createTool((_input, config) => host.callApi('noteControllerList', undefined, config), {
      name: 'list_demo_notes',
      description: '列出当前用户在数据权限范围内可见的演示便签。',
      schema: emptyInputSchema
    })
  ]
}
