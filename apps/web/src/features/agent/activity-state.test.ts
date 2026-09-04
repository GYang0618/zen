import { describe, expect, it } from 'vitest'

import {
  hasUnresolvedToolCalls,
  isAwaitingAgentWork,
  isPlaceholderMessage,
  isStreamingAssistantText,
  isTrailingReasoningAfterReply,
  lastMeaningfulMessage,
  shouldShowActivityIndicator,
  streamingActivitySignature
} from './activity-state'

import type { ActivityMessageLike } from './activity-state'

function user(id: string): ActivityMessageLike {
  return { id, role: 'user', content: id }
}

function assistant(content = '', toolCalls?: unknown[], id = 'a'): ActivityMessageLike {
  return { id, role: 'assistant', content, ...(toolCalls ? { toolCalls } : {}) }
}

function reasoning(content = '', id = 'r'): ActivityMessageLike {
  return { id, role: 'reasoning', content }
}

function tool(id = 't', toolCallId = 't1'): ActivityMessageLike {
  return { id, role: 'tool', toolCallId }
}

describe('isPlaceholderMessage', () => {
  it('空 assistant、空 reasoning、activity 视为占位', () => {
    expect(isPlaceholderMessage(assistant())).toBe(true)
    expect(isPlaceholderMessage(reasoning())).toBe(true)
    expect(isPlaceholderMessage({ role: 'activity' })).toBe(true)
  })

  it('有正文或工具调用的 assistant、有正文的 reasoning、user/tool 不是占位', () => {
    expect(isPlaceholderMessage(assistant('已删除'))).toBe(false)
    expect(isPlaceholderMessage(assistant('', [{ id: 't1' }]))).toBe(false)
    expect(isPlaceholderMessage(reasoning('先核对角色'))).toBe(false)
    expect(isPlaceholderMessage(user('u1'))).toBe(false)
    expect(isPlaceholderMessage({ role: 'user', content: [{ type: 'text', text: '你好' }] })).toBe(
      false
    )
    expect(isPlaceholderMessage(tool())).toBe(false)
  })
})

describe('lastMeaningfulMessage', () => {
  it('跳过末尾空消息，落到上一条有内容的 assistant', () => {
    expect(
      lastMeaningfulMessage([
        user('u'),
        assistant('已删除'),
        assistant('', undefined, 'a2'),
        reasoning()
      ])
    ).toEqual(assistant('已删除'))
  })

  it('跳过纯文本答案之后的收尾 reasoning', () => {
    expect(
      lastMeaningfulMessage([user('u'), assistant('角色已删除'), reasoning('收尾', 'r2')])
    ).toEqual(assistant('角色已删除'))
  })
})

describe('hasUnresolvedToolCalls', () => {
  it('assistant 的 tool call 尚未出现对应 tool 结果时为 true', () => {
    expect(hasUnresolvedToolCalls([assistant('', [{ id: 't1' }])])).toBe(true)
  })

  it('tool 结果已返回时为 false', () => {
    expect(hasUnresolvedToolCalls([assistant('', [{ id: 't1' }]), tool('t', 't1')])).toBe(false)
  })
})

describe('isStreamingAssistantText', () => {
  it('未运行时为 false', () => {
    expect(isStreamingAssistantText([assistant('你好')], false)).toBe(false)
  })

  it('最后一条是带正文的 assistant 时视为正在输出，隐藏思考条', () => {
    expect(isStreamingAssistantText([user('u'), assistant('角色已删除')], true)).toBe(true)
  })

  it('回答结束后跟上空 assistant / reasoning 仍视为本轮已写完，不闪思考条', () => {
    const messages = [
      user('u'),
      assistant('角色已删除'),
      assistant('', undefined, 'a2'),
      reasoning()
    ]
    expect(isStreamingAssistantText(messages, true)).toBe(true)
  })

  it('纯文本后跟上已完成的 tool 结果，视为在等下一跳模型', () => {
    expect(isStreamingAssistantText([user('u'), assistant('角色已删除'), tool()], true)).toBe(false)
    expect(isAwaitingAgentWork([user('u'), assistant('角色已删除'), tool()], true)).toBe(true)
  })

  it('纯文本叙述后跟上空工具调用 assistant，视为进入工具跳', () => {
    expect(
      isStreamingAssistantText(
        [
          user('u'),
          assistant('好的，我先检索', undefined, 'a1'),
          assistant('', [{ id: 't2' }], 'a2')
        ],
        true
      )
    ).toBe(false)
  })

  it('用户消息后只有空占位时仍显示思考条', () => {
    expect(isStreamingAssistantText([user('u'), assistant(), reasoning()], true)).toBe(false)
  })

  it('工具结果之后等待下一轮模型时显示思考条', () => {
    expect(isStreamingAssistantText([user('u'), assistant('', [{ id: 't1' }]), tool()], true)).toBe(
      false
    )
  })

  it('带正文的工具调用助手在工具结果之后仍显示思考条，表示在等下一跳模型', () => {
    expect(
      isStreamingAssistantText(
        [user('u'), assistant('好的，我先检索', [{ id: 't1' }]), tool()],
        true
      )
    ).toBe(false)
  })

  it('正在输出有正文的思考时隐藏底部思考条', () => {
    expect(isStreamingAssistantText([user('u'), reasoning('核对成员')], true)).toBe(true)
  })

  it('纯文本后的收尾 reasoning 不占用流式态，避免底部条和思考块一起消失', () => {
    expect(
      isStreamingAssistantText(
        [user('u'), assistant('角色列表已返回'), reasoning('收尾', 'r2')],
        true
      )
    ).toBe(true)
  })
})

describe('shouldShowActivityIndicator', () => {
  it('流式打字且无工具文案时不亮条', () => {
    expect(
      shouldShowActivityIndicator({
        isRunning: true,
        isStreamingText: true,
        streamIdle: false
      })
    ).toBe(false)
  })

  it('token 停更后即使仍判定为流式，也要亮等待条', () => {
    expect(
      shouldShowActivityIndicator({
        isRunning: true,
        isStreamingText: true,
        streamIdle: true
      })
    ).toBe(true)
  })

  it('有工具活动文案时即使正在打字也亮条', () => {
    expect(
      shouldShowActivityIndicator({
        isRunning: true,
        isStreamingText: true,
        streamIdle: false,
        activityLabel: '正在删除角色'
      })
    ).toBe(true)
  })
})

describe('streamingActivitySignature', () => {
  it('正文变化时签名变化', () => {
    const first = streamingActivitySignature([user('u'), assistant('角色')])
    const second = streamingActivitySignature([user('u'), assistant('角色列表')])
    expect(first).not.toEqual(second)
  })
})

describe('isTrailingReasoningAfterReply', () => {
  it('纯文本答案之后的 reasoning 视为收尾噪声', () => {
    expect(
      isTrailingReasoningAfterReply(
        [user('u'), assistant('角色已删除'), reasoning('收尾', 'r2')],
        'r2'
      )
    ).toBe(true)
  })

  it('答案之前的思考不是收尾噪声', () => {
    expect(
      isTrailingReasoningAfterReply(
        [user('u'), reasoning('先核对', 'r1'), assistant('角色已删除')],
        'r1'
      )
    ).toBe(false)
  })
})
