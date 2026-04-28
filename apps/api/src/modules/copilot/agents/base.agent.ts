import { ChatOpenAI } from '@langchain/openai'
import { createAgent } from 'langchain'

import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type {
  BuiltCopilotAgent,
  CopilotAgent,
  CopilotAgentName
} from '../interfaces/agent.interface'

const COPILOT_AGENT_MODEL_CONFIG = {
  model: 'kimi-k2.5',
  temperature: 0
} as const

type CreateAgentOptions = Parameters<typeof createAgent>[0]

export abstract class BaseCopilotAgent<Name extends CopilotAgentName>
  implements CopilotAgent<Name>
{
  abstract readonly name: Name
  abstract readonly description: string
  abstract readonly systemPrompt: string

  readonly llm: BaseChatModel = new ChatOpenAI(COPILOT_AGENT_MODEL_CONFIG)

  build(): BuiltCopilotAgent {
    const tools = this.getTools()

    return createAgent({
      model: this.llm,
      systemPrompt: this.systemPrompt,
      ...(tools ? { tools } : {})
    })
  }

  protected getTools(): CreateAgentOptions['tools'] | undefined {
    return undefined
  }
}
