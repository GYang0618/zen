import { describe, expect, it } from 'vitest'

import {
  isPlaceholderMessage,
  isStreamingAssistantText,
  isTrailingReasoningAfterReply,
  lastMeaningfulMessage
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

function tool(id = 't'): ActivityMessageLike {
  return { id, role: 'tool' }
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

  it('纯文本答案后跟上已完成的 tool 结果，不闪思考条', () => {
    expect(isStreamingAssistantText([user('u'), assistant('角色已删除'), tool()], true)).toBe(true)
  })

  it('纯文本答案后跟上空工具调用 assistant，不闪思考条', () => {
    expect(
      isStreamingAssistantText(
        [user('u'), assistant('角色已删除', undefined, 'a1'), assistant('', [{ id: 't2' }], 'a2')],
        true
      )
    ).toBe(true)
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
