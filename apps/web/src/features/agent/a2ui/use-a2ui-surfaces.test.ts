import { describe, expect, it } from 'vitest'

import { extractA2UISurfaces } from './use-a2ui-surfaces'

describe('extractA2UISurfaces', () => {
  it('空消息列表返回空 surfaces', () => {
    expect(extractA2UISurfaces([], false)).toEqual([])
  })

  it('普通工具调用（如 update_user_info）不会被提取为 A2UI Surface', () => {
    const messages = [
      {
        id: 'msg_1',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tc_update',
            function: {
              name: 'update_user_info',
              arguments: JSON.stringify({ id: 'u1', phone: '13800000000' })
            }
          }
        ]
      }
    ]

    const surfaces = extractA2UISurfaces(messages, false)
    expect(surfaces).toHaveLength(0)
  })

  it('query_users_list 工具调用不再作为 A2UI Surface 提取（后续由 useRenderTool 流式渲染）', () => {
    const messages = [
      {
        id: 'msg_1',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tc_users_1',
            function: {
              name: 'query_users_list',
              arguments: JSON.stringify({ status: 'suspended' })
            }
          }
        ]
      },
      {
        id: 'msg_tool_1',
        role: 'tool',
        toolCallId: 'tc_users_1',
        content: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'u_1',
                username: 'zhangsan',
                status: 'suspended'
              }
            ]
          }
        })
      }
    ]

    const surfaces = extractA2UISurfaces(messages, false)
    expect(surfaces).toHaveLength(0)
  })

  it('显式携带 a2ui_operations 的 generate_dynamic_dashboard 正确提取为 A2UI Surface', () => {
    const rawOps = [
      {
        version: 'v0.9',
        createSurface: { surfaceId: 'a2ui-dashboard-1', catalogId: 'zen-catalog' }
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'a2ui-dashboard-1',
          components: [
            {
              id: 'root',
              component: 'Column',
              title: '运营数据看板'
            }
          ]
        }
      }
    ]

    const messages = [
      {
        id: 'msg_1',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tc_dash_1',
            function: {
              name: 'generate_dynamic_dashboard',
              arguments: JSON.stringify({ title: '运营数据看板' })
            }
          }
        ]
      },
      {
        id: 'msg_tool_1',
        role: 'tool',
        toolCallId: 'tc_dash_1',
        content: JSON.stringify({
          success: true,
          a2ui_operations: rawOps
        })
      }
    ]

    const surfaces = extractA2UISurfaces(messages, false)
    expect(surfaces).toHaveLength(1)
    expect(surfaces[0].surfaceId).toBe('a2ui-dashboard-1')
    expect(surfaces[0].title).toBe('运营数据看板')
    expect(surfaces[0].toolCallId).toBe('tc_dash_1')
    expect(surfaces[0].operations).toHaveLength(2)
  })

  it('原生 a2ui-surface activity 消息提取为 A2UI Surface', () => {
    const messages = [
      {
        id: 'act_1',
        role: 'activity',
        activityType: 'a2ui-surface',
        content: {
          a2ui_operations: [
            {
              version: 'v0.9',
              createSurface: { surfaceId: 'custom-surface', catalogId: 'test-catalog' }
            }
          ]
        }
      }
    ]

    const surfaces = extractA2UISurfaces(messages, false)
    expect(surfaces).toHaveLength(1)
    expect(surfaces[0].surfaceId).toBe('custom-surface')
    expect(surfaces[0].operations).toHaveLength(1)
  })

  it('当同时存在 a2ui-surface activity 消息与 tool 消息时，自动去重且只保留单个 Surface', () => {
    const rawOps = [
      {
        version: 'v0.9',
        createSurface: { surfaceId: 'a2ui-17890000000', catalogId: 'test-catalog' }
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'a2ui-17890000000',
          components: [{ id: 'root', component: 'BarChart', title: '近 7 天活跃趋势' }]
        }
      }
    ]

    const messages = [
      {
        id: 'msg_assistant',
        role: 'assistant',
        toolCalls: [
          {
            id: 'call_abc_123',
            function: {
              name: 'generate_dynamic_dashboard',
              arguments: JSON.stringify({ title: '近 7 天活跃趋势' })
            }
          }
        ]
      },
      {
        id: 'msg_tool',
        role: 'tool',
        toolCallId: 'call_abc_123',
        content: JSON.stringify({
          code: 200,
          a2ui_operations: rawOps
        })
      },
      {
        id: 'msg_act',
        role: 'activity',
        activityType: 'a2ui-surface',
        content: {
          a2ui_operations: rawOps
        }
      }
    ]

    const surfaces = extractA2UISurfaces(messages, false)
    expect(surfaces).toHaveLength(1)
    expect(surfaces[0].surfaceId).toBe('a2ui-17890000000')
    expect(surfaces[0].title).toBe('近 7 天活跃趋势')
    expect(surfaces[0].toolCallId).toBe('call_abc_123')
  })
})
