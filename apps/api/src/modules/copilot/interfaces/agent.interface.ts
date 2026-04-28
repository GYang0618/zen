import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { createAgent } from 'langchain'

export const COPILOT_AGENTS = Symbol('COPILOT_AGENTS')

export const DEFAULT_COPILOT_AGENT_NAME = 'default_agent'

export type CopilotAgentName = `${string}_agent`

export type BuiltCopilotAgent = ReturnType<typeof createAgent>

export interface CopilotAgent<Name extends CopilotAgentName = CopilotAgentName> {
  readonly name: Name
  readonly description: string
  readonly llm: BaseChatModel
  readonly systemPrompt: string
  build(): BuiltCopilotAgent
}
