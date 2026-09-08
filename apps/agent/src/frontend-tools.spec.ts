import assert from 'node:assert/strict'
import { test } from 'node:test'

import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { createAgent, tool } from 'langchain'
import { z } from 'zod'

import { createFrontendToolsMiddleware } from './frontend-tools.js'

import type { BaseMessage } from '@langchain/core/messages'

class ScriptedModel extends BaseChatModel {
  calls = 0
  boundTools: unknown[] = []

  constructor(private readonly respond: (messages: BaseMessage[]) => AIMessage) {
    super({})
  }

  _llmType() {
    return 'scripted-test'
  }
  bindTools(tools: unknown[]) {
    this.boundTools = tools
    return this
  }
  async _generate(messages: BaseMessage[]) {
    this.calls += 1
    return { generations: [{ text: '', message: this.respond(messages) }] }
  }
}

const frontend = {
  tools: [
    {
      type: 'function' as const,
      function: { name: 'navigate', description: 'Navigate', parameters: { type: 'object' } }
    }
  ],
  context: []
}

test('frontend calls are returned without executing a backend tool or fabricating a result', async () => {
  const model = new ScriptedModel(
    () =>
      new AIMessage({
        content: '',
        tool_calls: [{ id: 'front-1', name: 'navigate', args: { path: '/' } }]
      })
  )
  const graph = createAgent({ model, middleware: [createFrontendToolsMiddleware([])] })
  const result = await graph.invoke({ messages: [new HumanMessage('Go home')], 'ag-ui': frontend })
  assert.equal(model.calls, 1)
  assert.equal(result.messages.length, 2)
  assert.equal(result.messages.at(-1)?.getType(), 'ai')
  assert.equal(model.boundTools.length, 1)
})

test('mixed calls resume pending backend work after the browser result without rerunning it', async () => {
  let executions = 0
  const lookup = tool(
    () => {
      executions += 1
      return 'found'
    },
    {
      name: 'lookup',
      description: 'Look up a record',
      schema: z.object({})
    }
  )
  const model = new ScriptedModel((messages) => {
    if (messages.some((message) => ToolMessage.isInstance(message))) return new AIMessage('Done')
    return new AIMessage({
      content: '',
      tool_calls: [
        { id: 'front-1', name: 'navigate', args: {} },
        { id: 'back-1', name: 'lookup', args: {} }
      ]
    })
  })
  const graph = createAgent({
    model,
    tools: [lookup],
    middleware: [createFrontendToolsMiddleware(['lookup'])]
  })
  const first = await graph.invoke({
    messages: [new HumanMessage('Navigate and look up')],
    'ag-ui': frontend
  })
  assert.equal(executions, 0)
  const resumed = await graph.invoke({
    ...first,
    messages: [
      ...first.messages,
      new ToolMessage({ content: 'navigated', tool_call_id: 'front-1' })
    ]
  })
  assert.equal(executions, 1)
  assert.equal(resumed.messages.at(-1)?.content, 'Done')
  assert.equal(resumed.messages.filter((message) => ToolMessage.isInstance(message)).length, 2)
})

test('frontend cannot shadow a reserved backend tool', async () => {
  const model = new ScriptedModel(() => new AIMessage('Never called'))
  const graph = createAgent({ model, middleware: [createFrontendToolsMiddleware(['navigate'])] })
  await assert.rejects(
    graph.invoke({ messages: [new HumanMessage('Run')], 'ag-ui': frontend }),
    /conflicts with a registered tool/
  )
  assert.equal(model.calls, 0)
})
