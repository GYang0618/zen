import {
  assignRoleDataScopeSchema,
  assignRoleMembersSchema,
  assignRolePermissionsSchema,
  cloneRoleSchema,
  createRoleSchema,
  deleteRolesSchema,
  pageQuerySchema,
  rolesQueryToolSchema,
  updateRoleSchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import {
  asSdkOptions,
  executeApiCall,
  roleControllerAddMembers,
  roleControllerAssignDataScope,
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
} from '../../../api'
import { ensurePermissionCodesExist } from './ensure-permission-codes'

const roleIdSchema = z.object({
  id: z.string().min(1, '角色 ID 不能为空').describe('角色 ID')
})

const updateRoleToolSchema = roleIdSchema.extend(updateRoleSchema.shape)
const cloneRoleToolSchema = roleIdSchema.extend(cloneRoleSchema.shape)
const assignRolePermissionsToolSchema = roleIdSchema.extend(assignRolePermissionsSchema.shape)
const assignRoleDataScopeToolSchema = roleIdSchema.extend(assignRoleDataScopeSchema.shape)
const addRoleMembersToolSchema = roleIdSchema.extend(assignRoleMembersSchema.shape)
const removeRoleMemberToolSchema = roleIdSchema.extend({
  userId: z.string().min(1, '用户 ID 不能为空').describe('要解绑的用户 ID')
})
const roleMembersQueryToolSchema = roleIdSchema.extend(pageQuerySchema.shape)

export const getRolesTool = tool(
  async (input, config) => {
    const { meta: _meta, ...query } = input
    return executeApiCall(config, async (_context) =>
      roleControllerFindAll(
        asSdkOptions({
          query
        })
      )
    )
  },
  {
    name: 'query_roles_list',
    description:
      '查询角色列表，可通过关键字（名称/编码）、持久化状态 status、派生展示状态 effectiveStatus（active/disabled/expired/locked）、数据范围筛选并分页。' +
      '返回列表精简字段（不含权限码与自定义组织白名单）；完整配置用 query_role_detail。' +
      'meta.display 只在用户要看的就是本次返回的这份列表时为 true；取证、归类、统计、为后续办理查数时为 false。',
    schema: rolesQueryToolSchema
  }
)

export const createRoleTool = tool(
  async (input, config) => {
    const blocked = await ensurePermissionCodesExist(input.permissionCodes, config)
    if (blocked) return blocked
    return executeApiCall(config, () =>
      roleControllerCreate(
        asSdkOptions({
          body: input
        })
      )
    )
  },
  {
    name: 'create_role',
    description:
      '创建自定义角色壳。dataScope 默认为 self；为 custom 时必须提供来自组织树的 customOrgIds。' +
      'permissionCodes 必须来自 query_permissions_list 的 active code，禁止编造；未传则详情页再配置。' +
      '系统角色不可通过此接口创建。',
    schema: createRoleSchema
  }
)

export const getRoleTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, async (_context) =>
      roleControllerFindOne({
        path: { id }
      })
    ),
  {
    name: 'query_role_detail',
    description:
      '根据角色 ID 查询详情（含权限编码、数据范围、成员预览、updatedAt）。' +
      '保存权限或数据范围前必须先调用本工具，将 updatedAt 作为 baseVersion。',
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
    description:
      '更新角色基本信息：名称、描述、图标、图标颜色、过期时间、排序、状态。' +
      '权限请用 assign_role_permissions；数据范围请用 assign_role_data_scope（均需乐观锁）。',
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
    description:
      '基于已有角色克隆（复制权限、数据范围与图标，不复制成员）。需提供新编码与名称。系统角色不可克隆。',
    schema: cloneRoleToolSchema
  }
)

export const listPermissionsTool = tool(
  async (_input, config) =>
    executeApiCall(config, async (_context) => roleControllerListPermissions()),
  {
    name: 'query_permissions_list',
    description:
      '获取按模块分组的权限目录（含 deprecated 标记）。' +
      '创建角色或 assign_role_permissions 前必须先调用，只使用 status=active 的 code。',
    schema: z.object({})
  }
)

export const listRoleMembersTool = tool(
  async ({ id, ...query }, config) =>
    executeApiCall(config, async (_context) =>
      roleControllerListMembers(
        asSdkOptions({
          path: { id },
          query
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
    executeApiCall(config, () => roleControllerRemoveMember({ path: { id, userId } })),
  {
    name: 'remove_role_member',
    description: '将指定用户从角色中解绑',
    schema: removeRoleMemberToolSchema
  }
)

export const assignRolePermissionsTool = tool(
  async ({ id, permissionCodes, baseVersion }, config) => {
    const blocked = await ensurePermissionCodesExist(permissionCodes, config)
    if (blocked) return blocked
    return executeApiCall(config, () =>
      roleControllerAssignPermissions(
        asSdkOptions({
          path: { id },
          body: { permissionCodes, baseVersion }
        })
      )
    )
  },
  {
    name: 'assign_role_permissions',
    description:
      '覆盖式保存角色权限。permissionCodes 必须来自 query_permissions_list 的 active code。' +
      '必须传入 baseVersion（角色详情的 updatedAt）做乐观锁。冲突时先 query_role_detail 再重试。' +
      '系统超级管理员权限不可改。',
    schema: assignRolePermissionsToolSchema
  }
)

export const assignRoleDataScopeTool = tool(
  async ({ id, dataScope, customOrgIds, baseVersion }, config) =>
    executeApiCall(config, () =>
      roleControllerAssignDataScope(
        asSdkOptions({
          path: { id },
          body: { dataScope, customOrgIds, baseVersion }
        })
      )
    ),
  {
    name: 'assign_role_data_scope',
    description:
      '保存角色数据范围。dataScope 为 custom 时必须提供来自组织树的 customOrgIds。' +
      '必须传入 baseVersion（角色详情的 updatedAt）做乐观锁。',
    schema: assignRoleDataScopeToolSchema
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
    description: '批量删除角色。系统内置角色或仍有成员的角色不可删除。',
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
  assignRoleDataScopeTool,
  deleteRolesTool
] as const
