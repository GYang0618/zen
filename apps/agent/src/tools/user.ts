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
import { executeApiCallOrRecover } from './recoverable-error'

import type { UserControllerAdminResetPasswordData, UserControllerFindAllData } from '../api'
import type { RecoverableHint } from './recoverable-error'

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

const USER_WRITE_HINTS: RecoverableHint[] = [
  {
    match: '部分角色不存在或已禁用',
    reason: 'ROLE_ID_INVALID',
    hint: '请先 query_roles_list，使用返回的 id（不要把 code 当 ID），且角色须为启用状态。'
  },
  {
    match: '部分组织不存在',
    reason: 'ORGANIZATION_ID_INVALID',
    hint: '请先 query_organization_tree，使用返回节点的 id。'
  },
  {
    match: '部分岗位不存在',
    reason: 'POSITION_ID_INVALID',
    hint: 'postId 必须是 query_organization_positions 返回的编制 id，不是岗位目录 jobProfileId。'
  },
  {
    match: '岗位不属于对应组织',
    reason: 'POSITION_ORG_MISMATCH',
    hint: '请对该组织调用 query_organization_positions，只使用该列表中的编制 id。'
  },
  {
    match: '主职组织最多只能有一个',
    reason: 'PRIMARY_ORG_CONFLICT',
    hint: 'organizations 中 isPrimary=true 最多一项。'
  },
  {
    match: '至少需要一个角色',
    reason: 'ROLE_REQUIRED',
    hint: '覆盖式分配必须至少保留一个角色。'
  },
  {
    match: '系统至少需要保留一名超级管理员',
    reason: 'SUPER_ADMIN_REQUIRED',
    hint: '不能移除最后一名超级管理员。'
  },
  {
    match: '不能删除当前登录用户',
    reason: 'CANNOT_DELETE_SELF',
    hint: '请从 ids 中去掉当前登录用户后再试。'
  },
  {
    match: '未找到可恢复的已删除用户',
    reason: 'USER_NOT_DELETED',
    hint: 'restore_deleted_users 只能恢复已软删除的用户。'
  }
]

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
    executeApiCallOrRecover(config, () => userControllerCreate({ body: input }), USER_WRITE_HINTS),
  {
    name: 'create_user',
    description:
      '创建用户账号。可不提供密码：系统会生成临时密码（仅本次响应返回）并要求首次登录或邀请链接设密。' +
      'roleIds 必须来自 query_roles_list 的 id（不是 code）；省略则分配默认 user 角色。' +
      'organizations.organizationId 来自组织树；postId 为 query_organization_positions 的编制 id，不是 jobProfileId。',
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
    executeApiCallOrRecover(
      config,
      () => userControllerUpdate({ path: { id }, body: data }),
      USER_WRITE_HINTS
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
    executeApiCallOrRecover(
      config,
      () => userControllerRestoreMany({ body: { ids } }),
      USER_WRITE_HINTS
    ),
  {
    name: 'restore_deleted_users',
    description: '批量恢复已软删除的用户',
    schema: deleteUsersSchema
  }
)

export const updateUsersStatusTool = tool(
  async (payload, config) =>
    executeApiCallOrRecover(
      config,
      () => userControllerUpdateStatus({ body: payload }),
      USER_WRITE_HINTS
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
    executeApiCallOrRecover(config, () => userControllerUnlock({ path: { id } }), USER_WRITE_HINTS),
  {
    name: 'unlock_user',
    description: '解锁因登录失败次数过多而被锁定的用户账号',
    schema: userIdSchema
  }
)

export const resetUserPasswordTool = tool(
  async ({ id, ...body }, config) =>
    executeApiCallOrRecover(
      config,
      () =>
        userControllerAdminResetPassword(
          asSdkOptions<UserControllerAdminResetPasswordData>({
            path: { id },
            body
          })
        ),
      USER_WRITE_HINTS
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
    executeApiCallOrRecover(
      config,
      () => userControllerRevokeSessions({ path: { id } }),
      USER_WRITE_HINTS
    ),
  {
    name: 'revoke_user_sessions',
    description: '强制下线指定用户的全部登录会话',
    schema: userIdSchema
  }
)

export const assignUserRolesTool = tool(
  async ({ id, roleIds }, config) =>
    executeApiCallOrRecover(
      config,
      () => userControllerAssignRoles({ path: { id }, body: { roleIds } }),
      USER_WRITE_HINTS
    ),
  {
    name: 'assign_user_roles',
    description:
      '覆盖式分配用户角色（替换全部角色，至少保留一个）。roleIds 必须来自 query_roles_list 的 id，不要用 code。' +
      '会刷新权限版本并强制下线目标用户。该操作需要用户确认后才能执行。',
    schema: assignUserRolesToolSchema
  }
)

export const replaceUserOrganizationsTool = tool(
  async ({ id, organizations }, config) =>
    executeApiCallOrRecover(
      config,
      () => userControllerReplaceOrganizations({ path: { id }, body: { organizations } }),
      USER_WRITE_HINTS
    ),
  {
    name: 'replace_user_organizations',
    description:
      '覆盖式同步用户在职组织归属，可指定 isPrimary 主职与 postId。' +
      'organizationId 来自组织树；postId 为 query_organization_positions 的编制 id，不是 jobProfileId。' +
      '传入空数组表示清空全部组织归属。会影响数据范围并强制下线。',
    schema: replaceUserOrganizationsToolSchema
  }
)

export const deleteUsersTool = tool(
  async ({ ids }, config) =>
    executeApiCallOrRecover(
      config,
      () => userControllerRemoveMany({ body: { ids } }),
      USER_WRITE_HINTS
    ),
  {
    name: 'delete_users',
    description: '批量软删除用户（可恢复），禁止删除当前登录用户自身。该操作需要用户确认后才能执行',
    schema: deleteUsersSchema
  }
)

export const hardDeleteUsersTool = tool(
  async ({ ids }, config) =>
    executeApiCallOrRecover(
      config,
      () => userControllerHardRemoveMany({ body: { ids } }),
      USER_WRITE_HINTS
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
