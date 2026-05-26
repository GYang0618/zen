import {
  createUserSchema,
  deleteUsersSchema,
  updateUserSchema,
  updateUsersStatusSchema,
  usersQuerySchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import {
  executeApiCall,
  userControllerCreate,
  userControllerFindAll,
  userControllerFindOne,
  userControllerHardRemoveMany,
  userControllerRemoveMany,
  userControllerRestoreMany,
  userControllerUpdate,
  userControllerUpdateStatus
} from '../api'

import type { UserControllerFindAllData } from '../api'

const userIdSchema = z.object({
  id: z.string().min(1, '用户 ID 不能为空')
})

const updateUserToolSchema = userIdSchema.extend(updateUserSchema.shape)

type FindAllQuery = NonNullable<UserControllerFindAllData['query']>

function normalizeUsersQuery(input: z.input<typeof usersQuerySchema>): FindAllQuery {
  const query: FindAllQuery = {}

  if (input.page !== undefined) query.page = Number(input.page)
  if (input.pageSize !== undefined) query.pageSize = Number(input.pageSize)
  if (input.keyword !== undefined) query.keyword = input.keyword
  if (input.sortBy !== undefined) query.sortBy = input.sortBy
  if (input.sortOrder !== undefined) query.sortOrder = input.sortOrder

  if (input.status !== undefined) {
    query.status = Array.isArray(input.status) ? input.status : [input.status]
  }
  if (input.role !== undefined) {
    query.role = Array.isArray(input.role) ? input.role : [input.role]
  }

  return query
}

export const getUsersTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      userControllerFindAll({
        query: normalizeUsersQuery(input)
      })
    ),
  {
    name: 'query_users_list',
    description:
      '查询用户列表，可通过关键字、用户状态、角色等条件筛选并分页。' +
      '结果会由前端表格 UI 展示；你只需在最终回复中用一两句话概括条数或结论，不要重复输出 Markdown 表格或逐行列出用户。',
    schema: usersQuerySchema
  }
)

export const createUserTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      userControllerCreate({
        body: input
      })
    ),
  {
    name: 'create_user',
    description: '创建一个新用户账号',
    schema: createUserSchema
  }
)

export const getUserTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () =>
      userControllerFindOne({
        path: { id }
      })
    ),
  {
    name: 'query_user_detail',
    description: '根据用户 ID 查询单个用户详情',
    schema: userIdSchema
  }
)

export const updateUserTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCall(config, () =>
      userControllerUpdate({
        path: { id },
        body: data
      })
    ),
  {
    name: 'update_user_info',
    description: '更新指定用户的基本信息（不含批量状态变更）',
    schema: updateUserToolSchema
  }
)

export const restoreUsersTool = tool(
  async ({ ids }, config) =>
    executeApiCall(config, () =>
      userControllerRestoreMany({
        body: { ids }
      })
    ),
  {
    name: 'restore_deleted_users',
    description: '恢复一个或者多个已删除用户',
    schema: deleteUsersSchema
  }
)

export const updateUsersStatusTool = tool(
  async (payload, config) =>
    executeApiCall(config, () =>
      userControllerUpdateStatus({
        body: payload
      })
    ),
  {
    name: 'update_user_status',
    description:
      '更新一个或者多个用户状态。禁用/停用/封禁/冻结账户必须使用 suspended；inactive 仅表示未完成激活；pending 表示待审核；active 表示正常可用。',
    schema: updateUsersStatusSchema
  }
)

export const deleteUsersTool = tool(
  async ({ ids }, config) =>
    executeApiCall(config, () =>
      userControllerRemoveMany({
        body: { ids }
      })
    ),
  {
    name: 'delete_users',
    description: '删除一个或者多个用户（可恢复），该操作需要用户确认后才能执行',
    schema: deleteUsersSchema
  }
)

export const hardDeleteUsersTool = tool(
  async ({ ids }, config) =>
    executeApiCall(config, () =>
      userControllerHardRemoveMany({
        body: { ids }
      })
    ),
  {
    name: 'hard_delete_users',
    description: '删除一个或者多个用户（不可恢复，高危操作），该操作需要管理员审批通过后才能执行',
    schema: deleteUsersSchema
  }
)

export const userTools = [
  getUsersTool,
  createUserTool,
  getUserTool,
  updateUserTool,
  restoreUsersTool,
  updateUsersStatusTool,
  deleteUsersTool,
  hardDeleteUsersTool
] as const
