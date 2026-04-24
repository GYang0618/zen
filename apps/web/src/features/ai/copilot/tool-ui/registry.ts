import { GetUsersToolUI } from './tools'

export const copilotToolUIRegistry = {
  get_users: GetUsersToolUI
} as const

export type CopilotToolUIName = keyof typeof copilotToolUIRegistry

export function isCopilotToolUIName(toolName: string): toolName is CopilotToolUIName {
  return Object.hasOwn(copilotToolUIRegistry, toolName)
}

export function getCopilotToolUI(toolName: string) {
  if (!isCopilotToolUIName(toolName)) return null
  return copilotToolUIRegistry[toolName]
}
