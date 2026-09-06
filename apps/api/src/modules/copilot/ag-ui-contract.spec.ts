import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LangGraphAgent as CopilotkitLangGraphAgent } from '@copilotkit/runtime/langgraph'
import { DEFAULT_AGENT_GRAPH_ID } from '@zen/shared'
import { Observable } from 'rxjs'

import { defaultAgent } from './agents.js'
import { LangGraphAgent } from './langgraph-runtime-agent.js'

const { jest } = import.meta

/**
 * AG-UI / CopilotKit v2 契约：运行时必须通过 v2 Express adapter 暴露 /info 与 SSE，
 * 且 Default Agent 使用独立 graphId，事件顺序由 Runtime 按 RUN_* / TEXT_* 推进。
 */
const AG_UI_RUN_EVENT_ORDER = [
  'RUN_STARTED',
  'TEXT_MESSAGE_START',
  'TEXT_MESSAGE_CONTENT',
  'TEXT_MESSAGE_END',
  'RUN_FINISHED'
] as const

describe('AG-UI CopilotKit v2 contract', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('Default Agent 绑定 default_agent 图并通过 assistantConfig 注入运行时上下文', () => {
    const agent = defaultAgent({
      deploymentUrl: 'http://langgraph.test',
      accessToken: 'token',
      auth: { tenantId: 'tenant-1', userId: 'user-1', permissions: ['system:user:list'] },
      threadId: 'thread-1',
      runId: 'run-1',
      traceId: 'trace-1'
    })

    expect(agent.graphId).toBe(DEFAULT_AGENT_GRAPH_ID)
    expect(agent.assistantConfig?.configurable).toMatchObject({
      accessToken: 'token',
      tenantId: 'tenant-1',
      userId: 'user-1',
      threadId: 'thread-1',
      agentRunId: 'run-1',
      traceId: 'trace-1',
      permissions: ['system:user:list']
    })
  })

  it('保留标准 AG-UI 事件顺序契约', () => {
    expect(AG_UI_RUN_EVENT_ORDER[0]).toBe('RUN_STARTED')
    expect(AG_UI_RUN_EVENT_ORDER.at(-1)).toBe('RUN_FINISHED')
    expect(new Set(AG_UI_RUN_EVENT_ORDER).size).toBe(AG_UI_RUN_EVENT_ORDER.length)
  })

  it('通过 v2 Express adapter 暴露 /info 与 SSE，而不是 Nest catch-all Controller', () => {
    const dir = dirname(fileURLToPath(import.meta.url))
    const service = readFileSync(join(dir, 'copilot.service.ts'), 'utf8')
    const middleware = readFileSync(join(dir, 'copilot-kit.middleware.ts'), 'utf8')
    const moduleSource = readFileSync(join(dir, 'copilot.module.ts'), 'utf8')
    expect(service).toContain('createCopilotExpressHandler')
    expect(service).toContain('copilotKitBasePath')
    expect(middleware).toContain('getHandler()')
    expect(moduleSource).toContain('CopilotKitMiddleware')
    expect(moduleSource).not.toContain('CopilotController')
    expect(existsSync(join(dir, 'copilot.controller.ts'))).toBe(false)
  })

  it('真实事件流保持 RUN_STARTED → 文本 → RUN_FINISHED 顺序', async () => {
    const source = new Observable((subscriber) => {
      for (const type of AG_UI_RUN_EVENT_ORDER) {
        subscriber.next({
          type,
          threadId: 'thread-1',
          runId: 'run-1',
          messageId: 'm1',
          delta: '你好'
        })
      }
      subscriber.complete()
    })
    jest.spyOn(CopilotkitLangGraphAgent.prototype, 'run').mockReturnValue(source as never)
    const agent = new LangGraphAgent({
      deploymentUrl: 'http://langgraph.test',
      graphId: DEFAULT_AGENT_GRAPH_ID
    })
    const types: string[] = []
    await new Promise<void>((resolve, reject) => {
      agent
        .run({
          threadId: 'thread-1',
          runId: 'run-1',
          messages: [{ id: 'u1', role: 'user', content: 'hi' }],
          state: {},
          tools: [],
          context: [],
          forwardedProps: {}
        } as never)
        .subscribe({
          next: (event: { type: string }) => types.push(event.type),
          error: reject,
          complete: resolve
        })
    })
    expect(types).toEqual([...AG_UI_RUN_EVENT_ORDER])
  })
})
