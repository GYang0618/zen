import assert from 'node:assert/strict'
import { test } from 'node:test'

import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { createAgent, tool } from 'langchain'
import { z } from 'zod'

import { AgentStateSchema } from '../schema/state.js'
import { userStateSyncMiddleware } from './user-state-sync.js'

import type { BaseMessage } from '@langchain/core/messages'
import type { AgentState } from '../schema/state.js'

class ScriptedModel extends BaseChatModel {
  calls = 0

  constructor(private readonly respond: (messages: BaseMessage[]) => AIMessage) {
    super({})
  }

  _llmType() {
    return 'scripted-test'
  }
  bindTools(_tools: unknown[]) {
    return this
  }
  async _generate(messages: BaseMessage[]) {
    this.calls += 1
    return { generations: [{ text: '', message: this.respond(messages) }] }
  }
}

const createMockUser = (id: string, username: string) => ({
  id,
  username,
  nickname: null,
  realName: null,
  avatar: null,
  gender: 'unknown' as const,
  email: `${username}@example.com`,
  phoneNumber: null,
  status: 'suspended' as const,
  isLocked: false,
  lockExpireAt: null,
  roles: [],
  organizations: [],
  mfaEnabled: false,
  mfaType: 'off' as const,
  mustChangePassword: false,
  lastPasswordChange: null,
  passwordExpireAt: null,
  loginAttempts: 0,
  lastLoginAt: null,
  lastLoginIp: null,
  lastActiveAt: null,
  activeSessionCount: 0,
  accessTokenExpiresAt: null,
  remark: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
})

const mockQueryTool = tool(
  async () =>
    JSON.stringify({
      code: 200,
      data: {
        items: [createMockUser('u1', 'user1'), createMockUser('u2', 'user2')],
        total: 2
      }
    }),
  {
    name: 'query_users_list',
    description: 'query users',
    schema: z.object({ status: z.string().optional() })
  }
)

const mockDeleteTool = tool(
  async () =>
    JSON.stringify({
      code: 200,
      message: 'deleted'
    }),
  {
    name: 'delete_users',
    description: 'delete users',
    schema: z.object({ ids: z.array(z.string()) })
  }
)

const mockUpdateTool = tool(
  async ({ id, phoneNumber }) =>
    JSON.stringify({
      code: 200,
      data: {
        ...createMockUser(id, 'user1'),
        phoneNumber
      }
    }),
  {
    name: 'update_user_info',
    description: 'update user info',
    schema: z.object({ id: z.string(), phoneNumber: z.string().optional() })
  }
)

const mockStatusTool = tool(
  async () =>
    JSON.stringify({
      code: 200,
      message: 'status updated'
    }),
  {
    name: 'update_user_status',
    description: 'update user status',
    schema: z.object({ ids: z.array(z.string()), status: z.string() })
  }
)

test('userStateSyncMiddleware populates inactive_users on query_users_list and filters on delete_users', async () => {
  const model = new ScriptedModel((messages) => {
    const last = messages.at(-1)
    if (last && (last as { _getType?: () => string })._getType?.() === 'tool') {
      return new AIMessage({ content: 'Done querying' })
    }
    return new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'call_query',
          name: 'query_users_list',
          args: { status: 'suspended' }
        }
      ]
    })
  })

  const agent = createAgent({
    model,
    tools: [mockQueryTool, mockDeleteTool, mockUpdateTool, mockStatusTool],
    stateSchema: AgentStateSchema,
    middleware: [userStateSyncMiddleware]
  })

  const result1 = (await agent.invoke({
    messages: [new HumanMessage('查询已停用用户')]
  })) as unknown as AgentState

  assert.equal(result1.inactive_users?.length, 2)
  assert.equal(result1.inactive_users[0].id, 'u1')
  assert.equal(result1.inactive_users[1].id, 'u2')

  // Now simulate delete_users tool call
  const deleteModel = new ScriptedModel((messages) => {
    const last = messages.at(-1)
    if (last && (last as { _getType?: () => string })._getType?.() === 'tool') {
      return new AIMessage({ content: 'Done deleting' })
    }
    return new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'call_delete',
          name: 'delete_users',
          args: { ids: ['u1'] }
        }
      ]
    })
  })

  const deleteAgent = createAgent({
    model: deleteModel,
    tools: [mockQueryTool, mockDeleteTool, mockUpdateTool, mockStatusTool],
    stateSchema: AgentStateSchema,
    middleware: [userStateSyncMiddleware]
  })

  const result2 = (await deleteAgent.invoke({
    messages: [new HumanMessage('删除用户 u1')],
    inactive_users: result1.inactive_users,
    users: result1.users
  })) as unknown as AgentState

  assert.equal(result2.inactive_users?.length, 1)
  assert.equal(result2.inactive_users[0].id, 'u2')
})

test('userStateSyncMiddleware patches user info on update_user_info', async () => {
  const updateModel = new ScriptedModel((messages) => {
    const last = messages.at(-1)
    if (last && (last as { _getType?: () => string })._getType?.() === 'tool') {
      return new AIMessage({ content: 'Done updating' })
    }
    return new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'call_update',
          name: 'update_user_info',
          args: { id: 'u1', phoneNumber: '13800000000' }
        }
      ]
    })
  })

  const agent = createAgent({
    model: updateModel,
    tools: [mockQueryTool, mockDeleteTool, mockUpdateTool, mockStatusTool],
    stateSchema: AgentStateSchema,
    middleware: [userStateSyncMiddleware]
  })

  const initialUsers = [createMockUser('u1', 'user1'), createMockUser('u2', 'user2')]

  const result = (await agent.invoke({
    messages: [new HumanMessage('修改 u1 手机号为 13800000000')],
    inactive_users: initialUsers,
    users: initialUsers
  })) as unknown as AgentState

  assert.equal(result.inactive_users?.length, 2)
  assert.equal(result.inactive_users[0].phoneNumber, '13800000000')
  assert.equal(result.users[0].phoneNumber, '13800000000')
  assert.equal(result.inactive_users[1].phoneNumber, null)
})

test('userStateSyncMiddleware removes user from inactive_users when activated via update_user_status', async () => {
  const statusModel = new ScriptedModel((messages) => {
    const last = messages.at(-1)
    if (last && (last as { _getType?: () => string })._getType?.() === 'tool') {
      return new AIMessage({ content: 'Done activating' })
    }
    return new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'call_status',
          name: 'update_user_status',
          args: { ids: ['u1'], status: 'active' }
        }
      ]
    })
  })

  const agent = createAgent({
    model: statusModel,
    tools: [mockQueryTool, mockDeleteTool, mockUpdateTool, mockStatusTool],
    stateSchema: AgentStateSchema,
    middleware: [userStateSyncMiddleware]
  })

  const initialUsers = [createMockUser('u1', 'user1'), createMockUser('u2', 'user2')]

  const result = (await agent.invoke({
    messages: [new HumanMessage('恢复启用用户 u1')],
    inactive_users: initialUsers,
    users: initialUsers
  })) as unknown as AgentState

  // u1 should be removed from inactive_users
  assert.equal(result.inactive_users?.length, 1)
  assert.equal(result.inactive_users[0].id, 'u2')

  // in users, u1's status should be updated to active
  const updatedU1 = result.users?.find((u) => u.id === 'u1')
  assert.equal(updatedU1?.status, 'active')
})
