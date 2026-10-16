import { LangGraphAgent } from '@ag-ui/langgraph'

import { bridgeOpenTextToToolCall } from './bridge-text-to-tool-call.js'

const agent = new LangGraphAgent({
  deploymentUrl: 'http://127.0.0.1:9',
  graphId: 'default_agent'
})
const events: Array<{ type: string; delta?: string; toolCallName?: string }> = []
agent.subscriber = {
  next: (event) => {
    if (!event) return
    events.push(event as { type: string; delta?: string; toolCallName?: string })
  }
} as typeof agent.subscriber
agent.activeRun = { id: 'run-1' }
agent.setMessageInProgress('run-1', { id: 'assistant-1', toolCallId: null, toolCallName: null })

const bridged = bridgeOpenTextToToolCall(agent, {
  event: 'on_chat_model_stream',
  data: {
    chunk: {
      id: 'chunk-2',
      response_metadata: {},
      tool_call_chunks: [{ id: 'call-1', name: 'render_a2ui', args: '{"title":"组织架构' }]
    }
  }
})
agent.handleSingleEvent({
  event: 'on_chat_model_stream',
  metadata: {},
  data: {
    chunk: {
      id: 'chunk-2',
      response_metadata: {},
      tool_call_chunks: [{ args: '运营报表"}' }]
    }
  }
})

console.log(
  JSON.stringify(
    {
      bridged,
      types: events.map((event) => event.type),
      names: events.map((event) => event.toolCallName ?? null),
      deltas: events.filter((event) => event.type === 'TOOL_CALL_ARGS').map((event) => event.delta),
      inProgress: agent.getMessageInProgress('run-1')
    },
    null,
    2
  )
)
