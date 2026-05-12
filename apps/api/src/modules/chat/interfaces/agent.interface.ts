import type { createAgent } from 'langchain'

export const CHAT_AGENTS = Symbol('CHAT_AGENTS')

export const DEFAULT_CHAT_AGENT_NAME = 'default_agent'

export type ChatAgentName = `${string}_agent`

export type BuiltChatAgent = ReturnType<typeof createAgent>

export interface ChatAgent<Name extends ChatAgentName = ChatAgentName> {
  readonly name: Name
  readonly description: string
  readonly systemPrompt: string
  build(options?: { enableThinking?: boolean }): BuiltChatAgent
}
