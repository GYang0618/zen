import { ChatOpenAI } from '@langchain/openai'
import { createAgent } from 'langchain'

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

  build({ enableThinking = false }: { enableThinking?: boolean } = {}): BuiltCopilotAgent {
    const model = new ChatOpenAI({
      ...COPILOT_AGENT_MODEL_CONFIG,
      ...(enableThinking ? { reasoning: { effort: 'medium' } } : {})
    })

    const tools = this.getTools()

    return createAgent({
      model,
      systemPrompt: this.systemPrompt,
      ...(tools ? { tools } : {})
    })
  }

  protected getTools(): CreateAgentOptions['tools'] | undefined {
    return undefined
  }
}
