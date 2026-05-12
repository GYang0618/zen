import { MemorySaver } from '@langchain/langgraph'
import { createAgent, humanInTheLoopMiddleware } from 'langchain'

import { createChatOpenAI } from '../chat-chat-model'

import type { BuiltChatAgent, ChatAgent, ChatAgentName } from '../interfaces/agent.interface'

type CreateAgentOptions = Parameters<typeof createAgent>[0]

export abstract class BaseChatAgent<Name extends ChatAgentName> implements ChatAgent<Name> {
  abstract readonly name: Name
  abstract readonly description: string
  abstract readonly systemPrompt: string

  private readonly checkpointer = new MemorySaver()

  build(/*{ enableThinking = false }: { enableThinking?: boolean } = {}*/): BuiltChatAgent {
    const model = createChatOpenAI()

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
