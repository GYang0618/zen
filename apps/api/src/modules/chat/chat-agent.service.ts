import {
  END,
  MemorySaver,
  MessagesValue,
  START,
  StateGraph,
  StateSchema
} from '@langchain/langgraph'
import { Inject, Injectable } from '@nestjs/common'
import { createAgent } from 'langchain'
import z from 'zod'

import { createChatOpenAI } from './chat-chat-model'
import { CHAT_AGENTS, DEFAULT_CHAT_AGENT_NAME } from './interfaces/agent.interface'

import type { ConditionalEdgeRouter, GraphNode } from '@langchain/langgraph'
import type { ChatAgent, ChatAgentName } from './interfaces/agent.interface'

const ROUTER_NODE_NAME = 'router'

const stateSchema = new StateSchema({
  input: MessagesValue,
  enableThinking: z.boolean().default(false),
  decision: z.string(),
  output: MessagesValue
})

type StateType = typeof stateSchema
type AgentNameTuple = readonly [ChatAgentName, ...ChatAgentName[]]

/**
 * 负责 LangGraph 图的构建与执行编排
 */
@Injectable()
export class ChatAgentService {
  private readonly agentRegistry: ReadonlyMap<ChatAgentName, ChatAgent>
  private readonly checkpointer = new MemorySaver()

  constructor(@Inject(CHAT_AGENTS) private readonly agents: readonly ChatAgent[]) {
    this.agentRegistry = this.createAgentRegistry(agents)
  }

  private createChatModel(/*enableThinking: boolean*/) {
    return createChatOpenAI()
  }

  createWorkflow() {
    const workflow = new StateGraph(stateSchema)

    for (const [routeName, agentNode] of this.createAgentNodes()) {
      workflow.addNode(routeName, agentNode).addEdge(routeName, END)
    }

    return workflow
      .addNode(ROUTER_NODE_NAME, this.createRouterNode())
      .addEdge(START, ROUTER_NODE_NAME)
      .addConditionalEdges(ROUTER_NODE_NAME, this.createRouteDecision())
  }

  buildAgent() {
    return this.createWorkflow().compile({ checkpointer: this.checkpointer })
  }

  private createRouterNode(): GraphNode<typeof stateSchema> {
    const routeDecisionSchema = this.createRouteDecisionSchema()

    return async (state) => {
      const lastMessageContent = state.input.at(-1)?.content
      const router = createAgent({
        model: this.createChatModel(/*state.enableThinking*/),
        systemPrompt: this.createRouterPrompt(),
        responseFormat: routeDecisionSchema
      })

      const result = await router.invoke({
        messages: [
          {
            role: 'user',
            content: this.stringifyMessageContent(lastMessageContent)
          }
        ]
      })

      const decision = routeDecisionSchema.parse(result.structuredResponse)

      return { decision: decision.agent }
    }
  }

  private stringifyMessageContent(content: unknown): string {
    if (typeof content === 'string') return content
    if (content == null) return ''

    return JSON.stringify(content)
  }

  private createAgentNodes(): Array<readonly [ChatAgentName, GraphNode<StateType>]> {
    return this.agents.map((agent) => [agent.name, this.createAgentNode(agent)] as const)
  }

  private createAgentNode(agent: ChatAgent): GraphNode<StateType> {
    return async (state, config) => {
      const builtAgent = agent.build({ enableThinking: state.enableThinking })
      const result = await builtAgent.invoke({ messages: state.input }, config)
      return { output: result.messages }
    }
  }

  private createRouteDecision(): ConditionalEdgeRouter<
    StateType,
    Record<string, unknown>,
    ChatAgentName
  > {
    return (state) => this.resolveRouteName(state.decision)
  }

  private createRouterPrompt(): string {
    const routeOptions = [...this.agentRegistry.values()]
      .map((agent) => `- ${agent.name}: ${agent.description}`)
      .join('\n')

    return `
      你是 Zen Admin Chat 的路由器，只负责根据用户输入选择最合适的 Agent。
      可选 Agent:
      ${routeOptions}
      如果没有明确匹配的 Agent，必须选择 ${DEFAULT_CHAT_AGENT_NAME}, 不能为空。
      只返回结构化路由结果，不要处理用户任务本身。
    `
  }

  private createRouteDecisionSchema() {
    return z
      .object({
        agent: z
          .enum(this.getRegisteredAgentNames())
          .default(DEFAULT_CHAT_AGENT_NAME)
          .describe('必须是一个已注册的 Agent 名称。')
      })
      .strict()
  }

  private getRegisteredAgentNames(): AgentNameTuple {
    const [firstAgentName, ...remainingAgentNames] = this.agentRegistry.keys()

    if (!firstAgentName) {
      throw new Error('At least one chat agent is required')
    }

    return [firstAgentName, ...remainingAgentNames]
  }

  private createAgentRegistry(agents: readonly ChatAgent[]): ReadonlyMap<ChatAgentName, ChatAgent> {
    const registry = new Map<ChatAgentName, ChatAgent>()

    for (const agent of agents) {
      if (registry.has(agent.name)) {
        throw new Error(`Duplicate chat agent name: ${agent.name}`)
      }

      registry.set(agent.name, agent)
    }

    if (!registry.has(DEFAULT_CHAT_AGENT_NAME)) {
      throw new Error(`Missing default chat agent: ${DEFAULT_CHAT_AGENT_NAME}`)
    }

    return registry
  }

  private resolveRouteName(routeName: string): ChatAgentName {
    if (this.isRegisteredRoute(routeName)) return routeName

    return DEFAULT_CHAT_AGENT_NAME
  }

  private isRegisteredRoute(routeName: string): routeName is ChatAgentName {
    return this.agentRegistry.has(routeName as ChatAgentName)
  }
}
