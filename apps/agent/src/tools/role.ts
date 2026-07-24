import {
  assignRoleMembersSchema,
  assignRolePermissionsSchema,
  cloneRoleSchema,
  createRoleSchema,
  deleteRolesSchema,
  pageQuerySchema,
  rolesQuerySchema,
  updateRoleSchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import {
  executeApiCall,
  roleControllerAddMembers,
  roleControllerAssignPermissions,
  roleControllerClone,
  roleControllerCreate,
  roleControllerFindAll,
  roleControllerFindOne,
  roleControllerListMembers,
  roleControllerListPermissions,
  roleControllerRemoveMany,
  roleControllerRemoveMember,
  roleControllerUpdate
} from '../api'

const roleIdSchema = z.object({
  id: z.string().min(1, '角色 ID 不能为空')
})

const updateRoleToolSchema = roleIdSchema.extend(updateRoleSchema.shape)
const cloneRoleToolSchema = roleIdSchema.extend(cloneRoleSchema.shape)
const assignRolePermissionsToolSchema = roleIdSchema.extend(assignRolePermissionsSchema.shape)
const addRoleMembersToolSchema = roleIdSchema.extend(assignRoleMembersSchema.shape)
const removeRoleMemberToolSchema = roleIdSchema.extend({
  userId: z.string().min(1, '用户 ID 不能为空').describe('要解绑的用户 ID')
})
const roleMembersQueryToolSchema = roleIdSchema.extend(pageQuerySchema.shape)

type RolesFindAllQuery = {
  page?: number
  pageSize?: number
  keyword?: string
  status?: Array<'active' | 'disabled'>
  dataScope?: Array<'all' | 'department' | 'department_only' | 'self' | 'custom'>
}

function normalizeRolesQuery(input: z.input<typeof rolesQuerySchema>): RolesFindAllQuery {
  const query: RolesFindAllQuery = {}

  if (input.page !== undefined) query.page = Number(input.page)
  if (input.pageSize !== undefined) query.pageSize = Number(input.pageSize)
  if (input.keyword !== undefined) query.keyword = input.keyword

  if (input.status !== undefined) {
    query.status = Array.isArray(input.status) ? input.status : [input.status]
  }
  if (input.dataScope !== undefined) {
    query.dataScope = Array.isArray(input.dataScope) ? input.dataScope : [input.dataScope]
  }

  return query
}

/** OpenAPI 未完整生成 body/query 时的调用参数断言 */
function asSdkOptions<T>(options: object): T {
  return options as T
}

export const getRolesTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      roleControllerFindAll(
        asSdkOptions({
          query: normalizeRolesQuery(input)
        })
      )
    ),
  {
    name: 'query_roles_list',
    description:
      '查询角色列表，可通过关键字、状态、数据范围等条件筛选并分页。' +
      '结果会由前端表格 UI 展示；你只需在最终回复中用一两句话概括条数或结论，不要重复输出 Markdown 表格或逐行列出角色。',
    schema: rolesQuerySchema
  }
)

export const createRoleTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      roleControllerCreate(
        asSdkOptions({
          body: input
        })
      )
    ),
  {
    name: 'create_role',
    description:
      '创建一个新角色。dataScope 为 custom 时必须提供 customOrgIds；可同时传入 permissionCodes 分配权限。',
    schema: createRoleSchema
  }
)

export const getRoleTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () =>
      roleControllerFindOne({
        path: { id }
      })
    ),
  {
    name: 'query_role_detail',
    description: '根据角色 ID 查询单个角色详情（含权限编码列表）',
    schema: roleIdSchema
  }
)

export const updateRoleTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCall(config, () =>
      roleControllerUpdate(
        asSdkOptions({
          path: { id },
          body: data
        })
      )
    ),
  {
    name: 'update_role_info',
    description: '更新指定角色的基本信息、状态、数据范围或权限列表',
    schema: updateRoleToolSchema
  }
)

export const cloneRoleTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCall(config, () =>
      roleControllerClone(
        asSdkOptions({
          path: { id },
          body: data
        })
      )
    ),
  {
    name: 'clone_role',
    description: '基于已有角色克隆生成新角色（深拷贝权限与数据边界），需提供新编码与名称',
    schema: cloneRoleToolSchema
  }
)

export const listPermissionsTool = tool(
  async (_input, config) => executeApiCall(config, () => roleControllerListPermissions()),
  {
    name: 'query_permissions_list',
    description: '获取按模块分组的全部权限列表，供角色权限配置参考',
    schema: z.object({})
  }
)

export const listRoleMembersTool = tool(
  async ({ id, page, pageSize }, config) =>
    executeApiCall(config, () =>
      roleControllerListMembers(
        asSdkOptions({
          path: { id },
          query: {
            ...(page !== undefined ? { page: Number(page) } : {}),
            ...(pageSize !== undefined ? { pageSize: Number(pageSize) } : {})
          }
        })
      )
    ),
  {
    name: 'query_role_members',
    description: '分页查询已绑定到指定角色的用户列表',
    schema: roleMembersQueryToolSchema
  }
)

export const addRoleMembersTool = tool(
  async ({ id, userIds }, config) =>
    executeApiCall(config, () =>
      roleControllerAddMembers(
        asSdkOptions({
          path: { id },
          body: { userIds }
        })
      )
    ),
  {
    name: 'add_role_members',
    description: '将一个或多个用户追加绑定到指定角色',
    schema: addRoleMembersToolSchema
  }
)

export const removeRoleMemberTool = tool(
  async ({ id, userId }, config) =>
    executeApiCall(config, () =>
      roleControllerRemoveMember({
        path: { id, userId }
      })
    ),
  {
    name: 'remove_role_member',
    description: '将指定用户从角色中解绑',
    schema: removeRoleMemberToolSchema
  }
)

export const assignRolePermissionsTool = tool(
  async ({ id, permissionCodes }, config) =>
    executeApiCall(config, () =>
      roleControllerAssignPermissions(
        asSdkOptions({
          path: { id },
          body: { permissionCodes }
        })
      )
    ),
  {
    name: 'assign_role_permissions',
    description: '覆盖式更新角色的权限编码列表',
    schema: assignRolePermissionsToolSchema
  }
)

export const deleteRolesTool = tool(
  async ({ ids }, config) =>
    executeApiCall(config, () =>
      roleControllerRemoveMany(
        asSdkOptions({
          body: { ids }
        })
      )
    ),
  {
    name: 'delete_roles',
    description:
      '删除一个或多个角色。系统内置角色或仍有成员的角色不可删除；该操作需要用户确认后才能执行',
    schema: deleteRolesSchema
  }
)

export const roleTools = [
  getRolesTool,
  createRoleTool,
  getRoleTool,
  updateRoleTool,
  cloneRoleTool,
  listPermissionsTool,
  listRoleMembersTool,
  addRoleMembersTool,
  removeRoleMemberTool,
  assignRolePermissionsTool,
  deleteRolesTool
] as const
