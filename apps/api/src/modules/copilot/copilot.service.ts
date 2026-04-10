import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain'
import { END, GraphNode, MessagesValue, START, StateGraph, StateSchema } from '@langchain/langgraph'
import { Injectable } from '@nestjs/common'
import { createUIMessageStreamResponse } from 'ai'
import { initChatModel } from 'langchain'

import type { CallDto } from './dto/call.dto'

@Injectable()
export class CopilotService {
  async call({ messages }: CallDto) {
    const langchainMessages = await toBaseMessages(messages)
    const graph = await createGraph()
    const stream = await graph.streamEvents(
      { messages: langchainMessages },
      {
        version: 'v2'
      }
    )

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream)
    })
  }
}

async function createGraph() {
  const State = new StateSchema({
    messages: MessagesValue
  })

  const callModel: GraphNode<typeof State> = async (state) => {
    const model = await initChatModel('gpt-4o-mini', { temperature: 0 })
    const response = await model.invoke(state.messages)
    return { messages: [response] }
  }

  const graph = new StateGraph(State)
    .addNode('agent', callModel)
    .addEdge(START, 'agent')
    .addEdge('agent', END)
    .compile()

  return graph
}
