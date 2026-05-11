import { MemorySaver } from '@langchain/langgraph'
import { createAgent, humanInTheLoopMiddleware } from 'langchain'

import { createCopilotChatOpenAI } from '../copilot-chat-model'

import type {
  BuiltCopilotAgent,
  CopilotAgent,
  CopilotAgentName
} from '../interfaces/agent.interface'

type CreateAgentOptions = Parameters<typeof createAgent>[0]

export abstract class BaseCopilotAgent<Name extends CopilotAgentName>
  implements CopilotAgent<Name>
{
  abstract readonly name: Name
  abstract readonly description: string
  abstract readonly systemPrompt: string

  private readonly checkpointer = new MemorySaver()

  build(/*{ enableThinking = false }: { enableThinking?: boolean } = {}*/): BuiltCopilotAgent {
    const model = createCopilotChatOpenAI()

    const tools = this.getTools()

    return createAgent({
      model,
      systemPrompt: this.systemPrompt,
      ...(tools ? { tools } : {}),
      middleware: [
        humanInTheLoopMiddleware({
          interruptOn: {
            delete_users: {
              allowedDecisions: ['approve', 'reject'],
              description: '即将删除用户，需要管理员审批。'
            },
            hard_delete_users: {
              allowedDecisions: ['approve', 'reject'],
              description: '即将彻底删除用户，需要管理员审批。'
            }
          }
        })
      ],
      checkpointer: this.checkpointer
    })
  }

  protected getTools(): CreateAgentOptions['tools'] | undefined {
    return undefined
  }
}
