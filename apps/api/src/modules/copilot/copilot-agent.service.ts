import { END, MessagesValue, START, StateGraph, StateSchema } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { Inject, Injectable } from '@nestjs/common'
import z from 'zod'

import { COPILOT_AGENTS, DEFAULT_COPILOT_AGENT_NAME } from './interfaces/agent.interface'

import type { ConditionalEdgeRouter, GraphNode } from '@langchain/langgraph'
import type {
  BuiltCopilotAgent,
  CopilotAgent,
  CopilotAgentName
} from './interfaces/agent.interface'

const ROUTER_NODE_NAME = 'router'

const routeDecisionSchema = z.object({
  agent: z.string().trim().min(1).default(DEFAULT_COPILOT_AGENT_NAME)
})

const stateSchema = new StateSchema({
  input: MessagesValue,
  decision: z.string(),
  output: MessagesValue
})

type StateType = typeof stateSchema

/**
 * 负责 LangGraph 图的构建与执行编排
 */
@Injectable()
export class CopilotAgentService {
  private readonly agentRegistry: ReadonlyMap<CopilotAgentName, CopilotAgent>

  constructor(@Inject(COPILOT_AGENTS) private readonly agents: readonly CopilotAgent[]) {
    this.agentRegistry = this.createAgentRegistry(agents)
  }

  private readonly llm = new ChatOpenAI({
    model: 'kimi-k2.5',
    temperature: 0
  })

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
    return this.createWorkflow().compile()
  }

  private createRouterNode(): GraphNode<typeof stateSchema> {
    const router = this.llm.withStructuredOutput(routeDecisionSchema)

    return async (state) => {
      const lastMessage = state.input.at(-1)?.content
      const result = await router.invoke([
        { role: 'system', content: this.createRouterPrompt() },
        { role: 'user', content: lastMessage ?? '' }
      ])

      const decision = routeDecisionSchema.parse(result)

      return { decision: this.resolveRouteName(decision.agent) }
    }
  }

  private createAgentNodes(): Array<readonly [CopilotAgentName, GraphNode<StateType>]> {
    return this.agents.map((agent) => [agent.name, this.createAgentNode(agent.build())] as const)
  }

  private createAgentNode(agent: BuiltCopilotAgent): GraphNode<StateType> {
    return async (state) => {
      const result = await agent.invoke({ messages: state.input })
      return { output: result.messages }
    }
  }

  private createRouteDecision(): ConditionalEdgeRouter<
    StateType,
    Record<string, unknown>,
    CopilotAgentName
  > {
    return (state) => this.resolveRouteName(state.decision)
  }

  private createRouterPrompt(): string {
    const routeOptions = [...this.agentRegistry.values()]
      .map((agent) => `- ${agent.name}: ${agent.description}`)
      .join('\n')

    return `
      你是 Zen Admin Copilot 的路由器，只负责根据用户输入选择最合适的 Agent。
      可选 Agent:
      ${routeOptions}
      如果没有明确匹配的 Agent，必须选择 ${DEFAULT_COPILOT_AGENT_NAME}。
      只返回结构化路由结果，不要处理用户任务本身。
    `
  }

  private createAgentRegistry(
    agents: readonly CopilotAgent[]
  ): ReadonlyMap<CopilotAgentName, CopilotAgent> {
    const registry = new Map<CopilotAgentName, CopilotAgent>()

    for (const agent of agents) {
      if (registry.has(agent.name)) {
        throw new Error(`Duplicate copilot agent name: ${agent.name}`)
      }

      registry.set(agent.name, agent)
    }

    if (!registry.has(DEFAULT_COPILOT_AGENT_NAME)) {
      throw new Error(`Missing default copilot agent: ${DEFAULT_COPILOT_AGENT_NAME}`)
    }

    return registry
  }

  private resolveRouteName(routeName: string): CopilotAgentName {
    if (this.isRegisteredRoute(routeName)) return routeName

    return DEFAULT_COPILOT_AGENT_NAME
  }

  private isRegisteredRoute(routeName: string): routeName is CopilotAgentName {
    return this.agentRegistry.has(routeName as CopilotAgentName)
  }
}
