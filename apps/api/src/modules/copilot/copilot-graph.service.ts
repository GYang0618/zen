import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import { Injectable } from '@nestjs/common'
import { AIMessage } from 'langchain'

import { UserTool } from '@/modules/user'

import type { ConditionalEdgeRouter, GraphNode } from '@langchain/langgraph'

type MessagesState = typeof MessagesAnnotation.State

/**
 * 负责 LangGraph 图的构建与执行编排
 */
@Injectable()
export class CopilotGraphService {
  constructor(private readonly userTool: UserTool) {}

  private llm = new ChatOpenAI({
    model: 'qwen3.5-flash',
    temperature: 0
  })

  buildGraph() {
    const toolNode = this.createToolNode()
    const callModel = this.createAgentNode()
    const shouldContinue = this.createEdgeRouter()

    return new StateGraph(MessagesAnnotation)
      .addNode('agent', callModel)
      .addNode('tools', toolNode)
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', shouldContinue, ['tools', END])
      .addEdge('tools', 'agent')
      .compile()
  }

  private createAgentNode(): GraphNode<MessagesState> {
    return async (state) => {
      const model = this.llm.bindTools(this.getTools())
      const response = await model.invoke(state.messages)
      console.log(response)

      return { messages: [response] }
    }
  }

  private createEdgeRouter(): ConditionalEdgeRouter<
    MessagesState,
    Record<string, unknown>,
    'tools'
  > {
    return (state) => {
      const lastMessage = state.messages.at(-1)
      if (!lastMessage || !AIMessage.isInstance(lastMessage)) return END
      if (lastMessage.tool_calls?.length) return 'tools'
      return END
    }
  }

  private createToolNode() {
    const tools = this.getTools()

    return new ToolNode(tools)
  }

  private getTools() {
    return [...this.userTool.getTools()]
  }
}
