import {
  copilotMessageSchema,
  copilotRunEventSchema,
  copilotToolResultSchema,
  DEFAULT_AGENT_GRAPH_ID,
  DEFAULT_AGENT_RUN_BUDGET,
  defaultAgentRunBudgetSchema
} from '@zen/shared'

import { defaultAgent, planAgent } from './agents.js'

describe('Copilot agent registration', () => {
  it('default agent 使用 default_agent 和统一运行预算', () => {
    const agent = defaultAgent({
      deploymentUrl: 'http://langgraph.test',
      accessToken: 'token',
      activePluginIds: ['demo-notes'],
      runId: 'run-1'
    })

    expect(agent.graphId).toBe(DEFAULT_AGENT_GRAPH_ID)
    expect(agent.assistantConfig).toMatchObject({
      recursion_limit: DEFAULT_AGENT_RUN_BUDGET.recursionLimit,
      configurable: {
        accessToken: 'token',
        activeAgentPlugins: ['demo-notes'],
        agentRunId: 'run-1',
        locale: 'zh-CN',
        permissions: [],
        modelMetadata: {
          provider: 'qwen'
        }
      }
    })
  })

  it('HITL 通过后把 step-up 令牌注入 configurable', () => {
    const agent = defaultAgent({
      deploymentUrl: 'http://langgraph.test',
      accessToken: 'token',
      stepUpToken: 'step-up-1'
    })

    expect(agent.assistantConfig).toMatchObject({
      configurable: {
        accessToken: 'token',
        stepUpToken: 'step-up-1'
      }
    })
  })

  it('Popup 的 plan agent 不注入 Default Agent 运行预算或用户 token', () => {
    const agent = planAgent({ deploymentUrl: 'http://langgraph.test' })

    expect(agent.graphId).toBe('plan_agent')
    expect(agent.assistantConfig).toBeUndefined()
  })
})

describe('Copilot run contracts', () => {
  it('默认预算包含递归、Token 和时间上限', () => {
    expect(defaultAgentRunBudgetSchema.parse(DEFAULT_AGENT_RUN_BUDGET)).toEqual(
      DEFAULT_AGENT_RUN_BUDGET
    )
  })

  it('运行事件要求稳定的 run/turn/sequence 标识', () => {
    expect(
      copilotRunEventSchema.parse({
        runId: 'run-1',
        turnId: 'turn-1',
        sequence: 0,
        type: 'tool.call.result',
        status: 'running',
        toolCallId: 'call-1',
        payload: { success: true },
        createdAt: '2026-08-29T00:00:00.000Z'
      })
    ).toMatchObject({ runId: 'run-1', turnId: 'turn-1', sequence: 0 })

    expect(() =>
      copilotRunEventSchema.parse({
        runId: 'run-1',
        turnId: 'turn-1',
        sequence: -1,
        type: 'run.started',
        createdAt: '2026-08-29T00:00:00.000Z'
      })
    ).toThrow()
  })

  it('reasoning/activity 不能成为可回传模型的 Message', () => {
    const message = {
      id: 'message-1',
      turnId: 'turn-1',
      sequence: 0,
      content: '仅用于界面展示'
    }

    expect(() => copilotMessageSchema.parse({ ...message, role: 'reasoning' })).toThrow()
    expect(() => copilotMessageSchema.parse({ ...message, role: 'activity' })).toThrow()
    expect(copilotMessageSchema.parse({ ...message, role: 'assistant' })).toMatchObject(message)
  })

  it('失败 ToolResult 必须提供错误码和可行动文案', () => {
    expect(() => copilotToolResultSchema.parse({ toolCallId: 'call-1', success: false })).toThrow()
    expect(
      copilotToolResultSchema.parse({
        toolCallId: 'call-1',
        success: false,
        reason: 'ROLE_ID_INVALID',
        message: '请先查询有效角色 ID'
      })
    ).toMatchObject({ reason: 'ROLE_ID_INVALID' })
  })
})
