import {
  chunkHasAssistantDelta,
  emitPendingToolCalls,
  extractToolCallFromToolStart,
  extractToolCallsFromModelEnd,
  resolveReasoningContent,
  runWithoutReasoningProcess,
  stringifyToolArgs
} from './langgraph-tool-call-stream'

import type { ExtractedToolCall, ToolCallStreamSink } from './langgraph-tool-call-stream'

function createSink(existingIds: string[] = []): ToolCallStreamSink & { events: unknown[] } {
  const events: unknown[] = []
  return {
    emittedToolCallStartIds: new Set(existingIds),
    activeRun: { hasFunctionStreaming: false, modelMadeToolCall: false },
    dispatchEvent: (event) => {
      events.push(event)
      return true
    },
    events
  }
}

describe('langgraph-tool-call-stream', () => {
  it('从扁平 AIMessage 取出全部并行 tool_calls', () => {
    const calls = extractToolCallsFromModelEnd({
      output: {
        id: 'msg-1',
        tool_calls: [
          { id: 'call-1', name: 'create_job_profile', args: { code: 'POS-1001' } },
          { id: 'call-2', name: 'create_job_profile', args: { code: 'POS-1002' } }
        ]
      }
    })

    expect(calls).toEqual([
      {
        id: 'call-1',
        name: 'create_job_profile',
        args: { code: 'POS-1001' },
        parentMessageId: 'msg-1'
      },
      {
        id: 'call-2',
        name: 'create_job_profile',
        args: { code: 'POS-1002' },
        parentMessageId: 'msg-1'
      }
    ])
  })

  it('兼容 LangChain 序列化 constructor / OpenAI function 形态', () => {
    const calls = extractToolCallsFromModelEnd({
      output: {
        lc: 1,
        type: 'constructor',
        kwargs: {
          id: 'msg-2',
          tool_calls: [
            {
              id: 'call-9',
              function: { name: 'query_job_profiles_list', arguments: '{"keyword":"研发"}' }
            }
          ]
        }
      }
    })

    expect(calls).toEqual([
      {
        id: 'call-9',
        name: 'query_job_profiles_list',
        args: '{"keyword":"研发"}',
        parentMessageId: 'msg-2'
      }
    ])
  })

  it('缺少 tool_calls 或非法结构时返回空数组', () => {
    expect(extractToolCallsFromModelEnd(undefined)).toEqual([])
    expect(extractToolCallsFromModelEnd({ output: { id: 'msg' } })).toEqual([])
    expect(extractToolCallsFromModelEnd({ output: { tool_calls: [{ name: 'x' }] } })).toEqual([])
  })

  it('从 on_tool_start 的 metadata 读取 langgraph_tool_call_id', () => {
    expect(
      extractToolCallFromToolStart({
        event: 'on_tool_start',
        name: 'create_job_profile',
        metadata: { langgraph_tool_call_id: 'call-3' },
        data: { input: { code: 'POS-1003', name: '前端' } }
      })
    ).toEqual({
      id: 'call-3',
      name: 'create_job_profile',
      args: { code: 'POS-1003', name: '前端' },
      parentMessageId: 'call-3'
    })
  })

  it('on_tool_start 没有 tool_call_id 时返回 null，避免用 run_id 冒充', () => {
    expect(
      extractToolCallFromToolStart({
        event: 'on_tool_start',
        name: 'create_job_profile',
        metadata: {},
        data: { input: { code: 'POS-1004' } }
      })
    ).toBeNull()
  })

  it('解析 Qwen reasoning_content，空字符串视为无推理', () => {
    expect(
      resolveReasoningContent({
        chunk: { additional_kwargs: { reasoning_content: '先查编码' } }
      })
    ).toEqual({ text: '先查编码', type: 'text', index: 0 })

    expect(
      resolveReasoningContent({
        chunk: { additional_kwargs: { reasoning_content: '' } }
      })
    ).toBeNull()
  })

  it('为尚未推送的工具补发 START/ARGS/END，并跳过已推送的 id', () => {
    const sink = createSink(['call-1'])
    const toolCalls: ExtractedToolCall[] = [
      {
        id: 'call-1',
        name: 'create_job_profile',
        args: { code: 'POS-1001' },
        parentMessageId: 'msg'
      },
      {
        id: 'call-2',
        name: 'create_job_profile',
        args: { code: 'POS-1002' },
        parentMessageId: 'msg'
      }
    ]

    emitPendingToolCalls(sink, toolCalls, { event: 'on_chat_model_end' })

    expect(sink.events).toEqual([
      expect.objectContaining({ type: 'TOOL_CALL_START', toolCallId: 'call-2' }),
      expect.objectContaining({
        type: 'TOOL_CALL_ARGS',
        toolCallId: 'call-2',
        delta: '{"code":"POS-1002"}'
      }),
      expect.objectContaining({ type: 'TOOL_CALL_END', toolCallId: 'call-2' })
    ])
    expect(sink.emittedToolCallStartIds.has('call-2')).toBe(true)
    expect(sink.activeRun?.hasFunctionStreaming).toBe(true)
  })

  it('stringifyToolArgs 保留已是字符串的增量', () => {
    expect(stringifyToolArgs('{"code":')).toBe('{"code":')
    expect(stringifyToolArgs({ code: 'POS-1001' })).toBe('{"code":"POS-1001"}')
  })

  it('纯推理 chunk 不含正文/工具增量，混合 chunk 才交给 AG-UI', () => {
    expect(
      chunkHasAssistantDelta({
        chunk: { additional_kwargs: { reasoning_content: '先查编码' }, content: '' }
      })
    ).toBe(false)

    expect(
      chunkHasAssistantDelta({
        chunk: { tool_call_chunks: [{ id: 'call-1', name: 'create_job_profile' }] }
      })
    ).toBe(true)

    expect(chunkHasAssistantDelta({ chunk: { content: '你好' } })).toBe(true)
  })

  it('runWithoutReasoningProcess 避免 AG-UI 误关推理，并在 super 清空后恢复', () => {
    const holder = { reasoningProcess: { messageId: 'r1' } as unknown }

    runWithoutReasoningProcess(holder, () => {
      expect(holder.reasoningProcess).toBeNull()
      holder.reasoningProcess = null
    })

    expect(holder.reasoningProcess).toEqual({ messageId: 'r1' })
  })
})
