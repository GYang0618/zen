import { LangGraphAgent as CopilotkitLangGraphAgent } from '@copilotkit/runtime/langgraph'
import { DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'
import { Observable } from 'rxjs'

import { LangGraphAgent } from './langgraph-runtime-agent.js'

const { jest } = import.meta

const RUN_INPUT = {
  threadId: 'thread-1',
  runId: 'run-1',
  messages: [
    { id: 'user-1', role: 'user', content: '你好' },
    { id: 'reasoning-1', role: 'reasoning', content: '展示信息' },
    { id: 'activity-1', role: 'activity', content: '查询中' }
  ],
  state: {},
  tools: [],
  context: [],
  forwardedProps: {}
}

describe('LangGraphAgent runtime policy', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it('Default Agent 过滤仅展示消息且不将断连映射为取消', () => {
    const source = new Observable(() => undefined)
    const run = jest
      .spyOn(CopilotkitLangGraphAgent.prototype, 'run')
      .mockReturnValue(source as never)
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    })

    agent.run(RUN_INPUT as never)

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [RUN_INPUT.messages[0]],
        forwardedProps: {}
      })
    )
  })

  it('Runtime 克隆 Default Agent 后保留持久化 Hooks', async () => {
    const source = new Observable((subscriber) => {
      subscriber.next({ type: 'RUN_STARTED' })
      subscriber.complete()
    })
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const hooks = {
      onStart: jest.fn().mockResolvedValue(undefined),
      onEvent: jest.fn().mockResolvedValue(undefined),
      onError: jest.fn().mockResolvedValue(undefined),
      onComplete: jest.fn().mockResolvedValue(undefined)
    }
    const registeredAgent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    }).setRuntimeHooks(hooks)
    const requestAgent = registeredAgent.clone() as LangGraphAgent

    await new Promise<void>((resolve, reject) => {
      requestAgent.run(RUN_INPUT as never).subscribe({ error: reject, complete: resolve })
    })

    expect(hooks.onStart).toHaveBeenCalledTimes(1)
    expect(hooks.onEvent).toHaveBeenCalledTimes(1)
    expect(hooks.onComplete).toHaveBeenCalledTimes(1)
    expect(hooks.onError).not.toHaveBeenCalled()
  })

  it('Default Agent 超时后取消运行并在持久化后结束事件流', async () => {
    jest.useFakeTimers()
    const source = new Observable(() => undefined)
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    })
    const abortRun = jest.spyOn(agent, 'abortRun').mockImplementation()
    const onError = jest.fn()

    const observedError = new Promise<unknown>((resolve) => {
      agent.run(RUN_INPUT as never).subscribe({
        error: (error) => {
          onError(error)
          resolve(error)
        }
      })
    })
    jest.advanceTimersByTime(DEFAULT_AGENT_RUN_BUDGET.timeoutMs)
    await observedError

    expect(abortRun).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(new Error('Default Agent run timed out'))
  })

  it('Default Agent 有流式事件时按空闲窗口续期', async () => {
    jest.useFakeTimers()
    let remoteSubscriber: { next: (event: unknown) => void } | undefined
    const source = new Observable((subscriber) => {
      remoteSubscriber = subscriber
    })
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    })
    const abortRun = jest.spyOn(agent, 'abortRun').mockImplementation()
    const onError = jest.fn()
    const observedError = new Promise<unknown>((resolve) => {
      agent.run(RUN_INPUT as never).subscribe({
        error: (error) => {
          onError(error)
          resolve(error)
        }
      })
    })
    await Promise.resolve()

    jest.advanceTimersByTime(DEFAULT_AGENT_RUN_BUDGET.timeoutMs - 1)
    remoteSubscriber?.next({ type: 'RUN_STARTED' })
    jest.advanceTimersByTime(DEFAULT_AGENT_RUN_BUDGET.timeoutMs - 1)
    expect(onError).not.toHaveBeenCalled()

    jest.advanceTimersByTime(2)
    await observedError
    expect(abortRun).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(new Error('Default Agent run timed out'))
  })

  it('Default Agent 工具连续失败时以带用量的预算错误结束', async () => {
    const source = new Observable((subscriber) => {
      for (let index = 0; index < DEFAULT_AGENT_RUN_BUDGET.maxFailures + 1; index += 1) {
        subscriber.next({
          type: 'TOOL_CALL_RESULT',
          content: JSON.stringify({ success: false, reason: 'VALIDATION_ERROR' })
        })
      }
    })
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    })
    const abortRun = jest.spyOn(agent, 'abortRun').mockImplementation()

    await expect(
      new Promise<void>((resolve, reject) => {
        agent.run(RUN_INPUT as never).subscribe({ error: reject, complete: resolve })
      })
    ).rejects.toEqual(
      new Error(
        `Default Agent run budget exceeded (failures ${DEFAULT_AGENT_RUN_BUDGET.maxFailures + 1}/${DEFAULT_AGENT_RUN_BUDGET.maxFailures})`
      )
    )
    expect(abortRun).toHaveBeenCalledTimes(1)
  })

  it('Default Agent 客户端断开后继续排空并持久化远程事件', async () => {
    let remoteSubscriber: { next: (event: unknown) => void; complete: () => void } | undefined
    const source = new Observable((subscriber) => {
      remoteSubscriber = subscriber
    })
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const hooks = {
      onStart: jest.fn().mockResolvedValue(undefined),
      onEvent: jest.fn().mockResolvedValue(undefined),
      onError: jest.fn().mockResolvedValue(undefined),
      onComplete: jest.fn().mockResolvedValue(undefined)
    }
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    }).setRuntimeHooks(hooks)
    const abortRun = jest.spyOn(agent, 'abortRun').mockImplementation()

    const subscription = agent.run(RUN_INPUT as never).subscribe()
    await Promise.resolve()
    subscription.unsubscribe()
    remoteSubscriber?.next({ type: 'RUN_STARTED' })
    remoteSubscriber?.complete()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(abortRun).not.toHaveBeenCalled()
    const persistedInput = expect.objectContaining({
      runId: RUN_INPUT.runId,
      threadId: RUN_INPUT.threadId,
      messages: [RUN_INPUT.messages[0]]
    })
    expect(hooks.onEvent).toHaveBeenCalledWith(persistedInput, { type: 'RUN_STARTED' })
    expect(hooks.onComplete).toHaveBeenCalledWith(persistedInput)
    expect(hooks.onError).not.toHaveBeenCalled()
  })

  it('Default Agent 显式取消时终止远程运行并注销控制项', async () => {
    const source = new Observable(() => undefined)
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const controls = new Map<string, () => void>()
    const runControl = {
      register: jest.fn((runId: string, abort: () => void) => controls.set(runId, abort)),
      unregister: jest.fn((runId: string, abort: () => void) => {
        if (controls.get(runId) === abort) controls.delete(runId)
      })
    }
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    }).setRunControl(runControl)
    const abortRun = jest.spyOn(agent, 'abortRun').mockImplementation()
    const observedError = new Promise<unknown>((resolve) => {
      agent.run(RUN_INPUT as never).subscribe({ error: resolve })
    })
    await Promise.resolve()

    controls.get(RUN_INPUT.runId)?.()

    await expect(observedError).resolves.toEqual(new Error('Default Agent run cancelled'))
    expect(abortRun).toHaveBeenCalledTimes(1)
    expect(runControl.unregister).toHaveBeenCalledTimes(1)
    expect(controls.has(RUN_INPUT.runId)).toBe(false)
  })

  it('事件持久化失败时以持久化错误终止事件流', async () => {
    const persistenceError = new Error('event persistence failed')
    const source = new Observable((subscriber) => {
      subscriber.next({ type: 'RUN_STARTED' })
    })
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const hooks = {
      onStart: jest.fn().mockResolvedValue(undefined),
      onEvent: jest.fn().mockRejectedValue(persistenceError),
      onError: jest.fn().mockResolvedValue(undefined),
      onComplete: jest.fn().mockResolvedValue(undefined)
    }
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    }).setRuntimeHooks(hooks)
    const abortRun = jest.spyOn(agent, 'abortRun').mockImplementation()

    await expect(
      new Promise<void>((resolve, reject) => {
        agent.run(RUN_INPUT as never).subscribe({
          error: reject,
          complete: resolve
        })
      })
    ).rejects.toBe(persistenceError)
    expect(abortRun).toHaveBeenCalledTimes(1)
    expect(hooks.onError).toHaveBeenCalledWith(expect.anything(), persistenceError)
    expect(hooks.onComplete).not.toHaveBeenCalled()
  })

  it('plan Agent 保持原输入且不启用 Default Agent 超时', () => {
    jest.useFakeTimers()
    const source = new Observable(() => undefined)
    const run = jest
      .spyOn(CopilotkitLangGraphAgent.prototype, 'run')
      .mockReturnValue(source as never)
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'plan_agent'
    })
    const abortRun = jest.spyOn(agent, 'abortRun').mockImplementation()

    agent.run(RUN_INPUT as never)
    jest.advanceTimersByTime(DEFAULT_AGENT_RUN_BUDGET.timeoutMs)

    expect(run).toHaveBeenCalledWith({
      ...RUN_INPUT,
      messages: [RUN_INPUT.messages[0]]
    })
    expect(abortRun).not.toHaveBeenCalled()
  })

  it('把 GraphInterrupt / RUN_ERROR interrupt 转成 INTERRUPT + RUN_FINISHED', async () => {
    const source = new Observable((subscriber) => {
      subscriber.next({ type: 'RUN_STARTED' })
      subscriber.next({ type: 'RUN_ERROR', message: 'interrupt' })
    })
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const hooks = {
      onStart: jest.fn().mockResolvedValue(undefined),
      onEvent: jest.fn().mockResolvedValue(undefined),
      onError: jest.fn().mockResolvedValue(undefined),
      onComplete: jest.fn().mockResolvedValue(undefined)
    }
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    }).setRuntimeHooks(hooks)
    const types: string[] = []
    await new Promise<void>((resolve, reject) => {
      agent.run(RUN_INPUT as never).subscribe({
        next: (event: { type: string }) => types.push(event.type),
        error: reject,
        complete: resolve
      })
    })
    expect(types).toEqual(['RUN_STARTED', 'CUSTOM', 'RUN_FINISHED'])
    expect(hooks.onError).not.toHaveBeenCalled()
    expect(hooks.onComplete).toHaveBeenCalledTimes(1)
    expect(hooks.onEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'RUN_FINISHED',
        outcome: expect.objectContaining({
          type: 'interrupt',
          interrupts: [expect.objectContaining({ id: expect.any(String), reason: 'approval' })]
        })
      })
    )
  })

  it('把 on_interrupt CUSTOM 载荷写入 RUN_FINISHED interrupts', async () => {
    const hitl = {
      actionRequests: [{ name: 'update_user_status', args: { ids: ['u1'], status: 'suspended' } }]
    }
    const source = new Observable((subscriber) => {
      subscriber.next({ type: 'RUN_STARTED' })
      subscriber.next({
        type: 'CUSTOM',
        name: 'on_interrupt',
        value: JSON.stringify(hitl),
        rawEvent: { id: 'lg-interrupt-1', value: hitl }
      })
      subscriber.next({ type: 'RUN_ERROR', message: 'interrupt' })
    })
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const hooks = {
      onStart: jest.fn().mockResolvedValue(undefined),
      onEvent: jest.fn().mockResolvedValue(undefined),
      onError: jest.fn().mockResolvedValue(undefined),
      onComplete: jest.fn().mockResolvedValue(undefined)
    }
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    }).setRuntimeHooks(hooks)
    const events: Array<{
      type: string
      name?: string
      outcome?: { interrupts?: Array<{ id: string }> }
    }> = []
    await new Promise<void>((resolve, reject) => {
      agent.run(RUN_INPUT as never).subscribe({
        next: (event: { type: string }) => events.push(event as never),
        error: reject,
        complete: resolve
      })
    })
    expect(events.map((event) => event.type)).toEqual(['RUN_STARTED', 'CUSTOM', 'RUN_FINISHED'])
    expect(events[1]).toEqual(
      expect.objectContaining({
        type: 'CUSTOM',
        name: 'on_interrupt'
      })
    )
    expect(JSON.parse(String((events[1] as { value?: unknown }).value))).toEqual(
      expect.objectContaining({ id: 'lg-interrupt-1', actionRequests: hitl.actionRequests })
    )
    expect(hooks.onEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'RUN_FINISHED',
        outcome: {
          type: 'interrupt',
          interrupts: [expect.objectContaining({ id: 'lg-interrupt-1' })]
        }
      })
    )
    expect(hooks.onError).not.toHaveBeenCalled()
  })

  it('CUSTOM on_interrupt 后直接 RUN_FINISHED 时仍持久化 interrupt outcome', async () => {
    const hitl = {
      actionRequests: [{ name: 'update_user_status', args: { ids: ['u1'], status: 'suspended' } }]
    }
    const source = new Observable((subscriber) => {
      subscriber.next({ type: 'RUN_STARTED' })
      subscriber.next({
        type: 'TOOL_CALL_START',
        toolCallId: 'tool-call-1',
        toolCallName: 'update_user_status'
      })
      subscriber.next({
        type: 'CUSTOM',
        name: 'on_interrupt',
        value: JSON.stringify(hitl)
      })
      subscriber.next({ type: 'STATE_SNAPSHOT', snapshot: {} })
      subscriber.next({
        type: 'RUN_FINISHED',
        threadId: 'thread-1',
        runId: 'run-1'
      })
      subscriber.complete()
    })
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const hooks = {
      onStart: jest.fn().mockResolvedValue(undefined),
      onEvent: jest.fn().mockResolvedValue(undefined),
      onError: jest.fn().mockResolvedValue(undefined),
      onComplete: jest.fn().mockResolvedValue(undefined)
    }
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: 'default_agent'
    }).setRuntimeHooks(hooks)
    const events: Array<{ type: string; outcome?: unknown; value?: unknown }> = []
    await new Promise<void>((resolve, reject) => {
      agent.run(RUN_INPUT as never).subscribe({
        next: (event: { type: string }) => events.push(event as never),
        error: reject,
        complete: resolve
      })
    })
    expect(events.map((event) => event.type)).toEqual([
      'RUN_STARTED',
      'TOOL_CALL_START',
      'CUSTOM',
      'STATE_SNAPSHOT',
      'RUN_FINISHED'
    ])
    expect(events.at(-1)).toEqual({
      type: 'RUN_FINISHED',
      threadId: 'thread-1',
      runId: 'run-1'
    })
    expect(JSON.parse(String(events[2]?.value))).toEqual(
      expect.objectContaining({
        id: 'tool-call-1',
        actionRequests: hitl.actionRequests
      })
    )
    expect(hooks.onEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'RUN_FINISHED',
        outcome: {
          type: 'interrupt',
          interrupts: [expect.objectContaining({ id: 'tool-call-1', toolCallId: 'tool-call-1' })]
        }
      })
    )
    expect(
      hooks.onEvent.mock.calls.some(([, event]) => event.type === 'RUN_FINISHED' && !event.outcome)
    ).toBe(false)
    expect(hooks.onComplete).toHaveBeenCalledTimes(1)
    expect(hooks.onError).not.toHaveBeenCalled()
  })
})
