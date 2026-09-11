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

  it('query_users_list 工具调用提取为 UserTable A2UI Surface', () => {
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
    expect(surfaces).toHaveLength(1)

    const surface = surfaces[0]
    expect(surface.surfaceId).toBe('a2ui-tc_users_1')
    expect(surface.title).toBe('已停用用户列表')
    expect(surface.isExecuting).toBe(false)
    expect(surface.operations.length).toBeGreaterThanOrEqual(2)

    const createOp = surface.operations[0] as {
      version: string
      createSurface: { surfaceId: string; catalogId: string }
    }
    expect(createOp.version).toBe('v0.9')
    expect(createOp.createSurface.surfaceId).toBe('a2ui-tc_users_1')

    const updateOp = surface.operations[1] as {
      version: string
      updateComponents: {
        surfaceId: string
        components: Array<{
          id: string
          component: string
          props: {
            title: string
            stateKey: string
            users: Array<{ id: string }>
            isLoading: boolean
          }
        }>
      }
    }
    expect(updateOp.version).toBe('v0.9')
    expect(updateOp.updateComponents.components[0].component).toBe('UserTable')
    expect(updateOp.updateComponents.components[0].props.title).toBe('已停用用户列表')
    expect(updateOp.updateComponents.components[0].props.stateKey).toBe('inactive_users')
    expect(updateOp.updateComponents.components[0].props.users).toHaveLength(1)
  })

  it('正在执行中的 query_users_list 正确标记 isExecuting 为 true', () => {
    const messages = [
      {
        id: 'msg_1',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tc_users_running',
            function: {
              name: 'query_users_list',
              arguments: JSON.stringify({ status: 'active' })
            }
          }
        ]
      }
    ]

    const surfaces = extractA2UISurfaces(messages, true)
    expect(surfaces).toHaveLength(1)
    expect(surfaces[0].isExecuting).toBe(true)
    expect(surfaces[0].title).toBe('用户列表')
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

  it('按 keyword 查询用户列表（如 QQ 邮箱）时，title 为用户列表且 stateKey 为 users', () => {
    const messages = [
      {
        id: 'msg_1',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tc_qq_users',
            function: {
              name: 'query_users_list',
              arguments: JSON.stringify({ keyword: '@qq.com' })
            }
          }
        ]
      },
      {
        id: 'msg_tool_qq',
        role: 'tool',
        toolCallId: 'tc_qq_users',
        content: JSON.stringify({
          code: 200,
          message: 'OK',
          data: {
            items: [
              { id: 'u_qq_1', email: 'test1@qq.com', status: 'active' },
              { id: 'u_qq_2', email: 'test2@qq.com', status: 'suspended' }
            ]
          }
        })
      }
    ]

    const surfaces = extractA2UISurfaces(messages, false)
    expect(surfaces).toHaveLength(1)
    expect(surfaces[0].title).toBe('用户列表')

    const updateOp = surfaces[0].operations[1] as {
      updateComponents: {
        components: Array<{
          title?: string
          stateKey?: string
          users?: unknown[]
          props?: {
            title?: string
            stateKey?: string
            users?: unknown[]
          }
        }>
      }
    }
    const component = updateOp.updateComponents.components[0]
    expect(component.props?.title ?? component.title).toBe('用户列表')
    expect(component.props?.stateKey ?? component.stateKey).toBe('users')
    expect(component.props?.users ?? component.users).toHaveLength(2)
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
