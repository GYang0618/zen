import {
  adminResetPasswordSchema,
  assignUserRolesSchema,
  createUserSchema,
  deleteUsersSchema,
  replaceUserOrganizationsSchema,
  updateUserSchema,
  updateUsersStatusSchema,
  usersQuerySchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import {
  asSdkOptions,
  executeApiCall,
  toQueryArray,
  userControllerAdminResetPassword,
  userControllerAssignRoles,
  userControllerCreate,
  userControllerFindAll,
  userControllerFindOne,
  userControllerHardRemoveMany,
  userControllerRemoveMany,
  userControllerReplaceOrganizations,
  userControllerRestoreMany,
  userControllerRevokeSessions,
  userControllerUnlock,
  userControllerUpdate,
  userControllerUpdateStatus
} from '../api'

import type { UserControllerAdminResetPasswordData, UserControllerFindAllData } from '../api'

const userIdSchema = z.object({
  id: z.string().min(1, '用户 ID 不能为空').describe('用户 ID')
})

const updateUserToolSchema = userIdSchema.extend(updateUserSchema.shape)
const resetUserPasswordToolSchema = userIdSchema.extend(adminResetPasswordSchema.shape)
const assignUserRolesToolSchema = userIdSchema.extend(assignUserRolesSchema.shape)
const replaceUserOrganizationsToolSchema = userIdSchema.extend(replaceUserOrganizationsSchema.shape)

type FindAllQuery = NonNullable<UserControllerFindAllData['query']>

function normalizeUsersQuery(input: z.input<typeof usersQuerySchema>): FindAllQuery {
  const query: FindAllQuery = {}

  if (input.page !== undefined) query.page = Number(input.page)
  if (input.pageSize !== undefined) query.pageSize = Number(input.pageSize)
  if (input.keyword !== undefined) query.keyword = input.keyword
  if (input.sortBy !== undefined) query.sortBy = input.sortBy
  if (input.sortOrder !== undefined) query.sortOrder = input.sortOrder
  if (input.organizationId !== undefined) query.organizationId = input.organizationId

  const status = toQueryArray(input.status)
  if (status) query.status = status

  const role = toQueryArray(input.role)
  if (role) query.role = role

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
      '查询用户列表，可通过关键字（邮箱/用户名/昵称/真实姓名/手机号）、状态、角色编码、在职组织、排序字段筛选并分页。',
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
    description:
      '创建用户账号。可不提供密码：系统会生成临时密码（仅本次响应返回）并要求首次登录或邀请链接设密。' +
      '可同时指定 roleIds（省略则分配默认 user 角色）与 organizations（主职/岗位）；省略组织时不绑定组织。',
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
    description: '根据用户 ID 查询详情，含角色预览、在职组织/岗位、锁定与会话等安全信息',
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
    description:
      '更新用户基本资料（邮箱、昵称、真实姓名、手机号、性别、备注、头像）。用户名与密码不可通过此接口修改。',
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
    description: '批量恢复已软删除的用户',
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
      '批量更新用户状态。禁用/停用/封禁/冻结必须使用 suspended；inactive 仅表示未完成激活；pending 表示待审核；active 表示正常可用。',
    schema: updateUsersStatusSchema
  }
)

export const unlockUserTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () =>
      userControllerUnlock({
        path: { id }
      })
    ),
  {
    name: 'unlock_user',
    description: '解锁因登录失败次数过多而被锁定的用户账号',
    schema: userIdSchema
  }
)

export const resetUserPasswordTool = tool(
  async ({ id, ...body }, config) =>
    executeApiCall(config, () =>
      userControllerAdminResetPassword(
        asSdkOptions<UserControllerAdminResetPasswordData>({
          path: { id },
          body
        })
      )
    ),
  {
    name: 'reset_user_password',
    description:
      '管理员重置用户密码。密码需含大小写字母、数字和特殊字符，至少 8 位。' +
      'mustChangePassword 默认为 true，表示下次登录必须改密。',
    schema: resetUserPasswordToolSchema
  }
)

export const revokeUserSessionsTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () =>
      userControllerRevokeSessions({
        path: { id }
      })
    ),
  {
    name: 'revoke_user_sessions',
    description: '强制下线指定用户的全部登录会话',
    schema: userIdSchema
  }
)

export const assignUserRolesTool = tool(
  async ({ id, roleIds }, config) =>
    executeApiCall(config, () =>
      userControllerAssignRoles({
        path: { id },
        body: { roleIds }
      })
    ),
  {
    name: 'assign_user_roles',
    description:
      '覆盖式分配用户角色（替换全部角色，至少保留一个）。会刷新权限版本并强制下线目标用户。' +
      '该操作需要用户确认后才能执行。',
    schema: assignUserRolesToolSchema
  }
)

export const replaceUserOrganizationsTool = tool(
  async ({ id, organizations }, config) =>
    executeApiCall(config, () =>
      userControllerReplaceOrganizations({
        path: { id },
        body: { organizations }
      })
    ),
  {
    name: 'replace_user_organizations',
    description:
      '覆盖式同步用户在职组织归属，可指定 isPrimary 主职与 postId 岗位。' +
      '传入空数组表示清空全部组织归属。会影响数据范围并强制下线。',
    schema: replaceUserOrganizationsToolSchema
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
    description: '批量软删除用户（可恢复），禁止删除当前登录用户自身。该操作需要用户确认后才能执行',
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
    description:
      '批量物理删除用户（不可恢复，高危操作），禁止删除当前登录用户自身。该操作需要管理员审批通过后才能执行',
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
  unlockUserTool,
  resetUserPasswordTool,
  revokeUserSessionsTool,
  assignUserRolesTool,
  replaceUserOrganizationsTool,
  deleteUsersTool,
  hardDeleteUsersTool
] as const
