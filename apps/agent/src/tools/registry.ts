import { organizationTools } from './modules/organization'
import { postTools } from './modules/post'
import { roleTools } from './modules/role'
import { userTools } from './modules/user'
import { getToolExecutionPolicy } from './policy'

/**
 * Default Agent 的唯一 Tool 聚合边界。
 * 插件 Tool 暂不装载；恢复时在此接入生成注册表即可。
 */
export const coreTools = [...userTools, ...roleTools, ...organizationTools, ...postTools]

function assertUniqueToolNames(tools: readonly { name: string }[]): void {
  const seen = new Set<string>()
  for (const tool of tools) {
    if (seen.has(tool.name)) {
      throw new Error(`Duplicate agent tool name: ${tool.name}`)
    }
    seen.add(tool.name)
  }
}

function assertExecutionPolicies(tools: readonly { name: string }[]): void {
  for (const tool of tools) {
    if (!getToolExecutionPolicy(tool.name)) {
      throw new Error(`Missing execution policy for agent tool: ${tool.name}`)
    }
  }
}

assertUniqueToolNames(coreTools)
assertExecutionPolicies(coreTools)
