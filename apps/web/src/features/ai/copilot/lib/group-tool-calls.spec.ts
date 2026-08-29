import { describe, expect, it } from 'vitest'

import {
  collectAbsorbedAssistantIds,
  groupConsecutiveToolCalls,
  resolveAssistantToolCalls
} from './group-tool-calls'

import type { AssistantToolMessageLike, ToolCallLike } from './group-tool-calls'

function call(id: string, name: string): ToolCallLike {
  return { id, function: { name, arguments: '{}' } }
}

function assistant(id: string, tools: ToolCallLike[], content = ''): AssistantToolMessageLike {
  return { id, role: 'assistant', content, toolCalls: tools }
}

describe('groupConsecutiveToolCalls', () => {
  it('连续同名写工具合并为一组', () => {
    const grouped = groupConsecutiveToolCalls([
      call('1', 'delete_job_profile'),
      call('2', 'delete_job_profile'),
      call('3', 'create_job_profile')
    ])

    expect(grouped.map((group) => group.map((item) => item.id))).toEqual([['1', '2'], ['3']])
  })

  it('Generative UI 工具即使同名也不合并', () => {
    const grouped = groupConsecutiveToolCalls([
      call('1', 'query_job_profiles_list'),
      call('2', 'query_job_profiles_list')
    ])

    expect(grouped).toHaveLength(2)
  })

  it('空列表返回空分组', () => {
    expect(groupConsecutiveToolCalls([])).toEqual([])
  })
})

describe('resolveAssistantToolCalls', () => {
  it('把思考夹着的同名删除并入第一条，后续 assistant 隐藏工具卡片', () => {
    const messages: AssistantToolMessageLike[] = [
      assistant('a1', [call('t1', 'delete_job_profile')]),
      { id: 'r1', role: 'reasoning' },
      assistant('a2', [call('t2', 'delete_job_profile')])
    ]

    expect(collectAbsorbedAssistantIds(messages)).toEqual(new Set(['a2']))
    expect(resolveAssistantToolCalls(messages, 'a1').toolCalls.map((item) => item.id)).toEqual([
      't1',
      't2'
    ])
    expect(resolveAssistantToolCalls(messages, 'a2')).toEqual({ hidden: true, toolCalls: [] })
  })

  it('用户消息会打断合并', () => {
    const messages: AssistantToolMessageLike[] = [
      assistant('a1', [call('t1', 'delete_job_profile')]),
      { id: 'u1', role: 'user', content: '继续' },
      assistant('a2', [call('t2', 'delete_job_profile')])
    ]

    expect(collectAbsorbedAssistantIds(messages).size).toBe(0)
    expect(resolveAssistantToolCalls(messages, 'a2').toolCalls).toHaveLength(1)
  })

  it('带正文的后续 assistant 不并入', () => {
    const messages: AssistantToolMessageLike[] = [
      assistant('a1', [call('t1', 'delete_job_profile')]),
      assistant('a2', [call('t2', 'delete_job_profile')], '已删除两个岗位')
    ]

    expect(collectAbsorbedAssistantIds(messages).size).toBe(0)
  })
})
