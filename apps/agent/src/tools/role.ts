import {
  assignRoleDataScopeSchema,
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
  roleControllerUpdate,
  toQueryArray
} from '../api'
import { executeApiCallOrRecover, isToolFailureResult } from './recoverable-error'
import { parsePermissionCatalog, unknownPermissionCodesResult } from './role-permission-guard'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { RecoverableHint } from './recoverable-error'

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

type RolesFindAllQuery = {
  page?: number
  pageSize?: number
  keyword?: string
  status?: Array<'active' | 'disabled'>
  effectiveStatus?: Array<'active' | 'disabled' | 'expired' | 'locked'>
  dataScope?: Array<'all' | 'org_and_child' | 'org' | 'self' | 'custom'>
}

function normalizeRolesQuery(input: z.input<typeof rolesQuerySchema>): RolesFindAllQuery {
  const query: RolesFindAllQuery = {}

  if (input.page !== undefined) query.page = Number(input.page)
  if (input.pageSize !== undefined) query.pageSize = Number(input.pageSize)
  if (input.keyword !== undefined) query.keyword = input.keyword

  const status = toQueryArray(input.status)
  if (status) query.status = status

  const effectiveStatus = toQueryArray(input.effectiveStatus)
  if (effectiveStatus) query.effectiveStatus = effectiveStatus

  const dataScope = toQueryArray(input.dataScope)
  if (dataScope) query.dataScope = dataScope

  return query
}

const ROLE_WRITE_HINTS: RecoverableHint[] = [
  {
    match: '部分权限编码不存在',
    reason: 'PERMISSION_CODE_INVALID',
    hint: '请先 query_permissions_list，只使用 status=active 的 code，不要编造编码。'
  },
  {
    match: '角色编码已存在',
    reason: 'ROLE_CODE_CONFLICT',
    hint: '请先 query_roles_list 换一个未被占用的编码（小写字母开头，仅字母数字下划线）。'
  },
  {
    match: '角色已被他人修改',
    reason: 'ROLE_VERSION_CONFLICT',
    hint: '请先 query_role_detail，把最新 updatedAt 作为 baseVersion 再重试。'
  },
  {
    match: '自定义数据范围时至少选择一个组织',
    reason: 'CUSTOM_ORG_REQUIRED',
    hint: 'dataScope=custom 时必须提供 customOrgIds，ID 来自 query_organization_tree。'
  },
  {
    match: '部分组织不存在',
    reason: 'ORGANIZATION_ID_INVALID',
    hint: '请先 query_organization_tree，使用返回节点的 id。'
  },
  {
    match: '系统角色不可克隆',
    reason: 'SYSTEM_ROLE_LOCKED',
    hint: '请改用自定义角色作为克隆源。'
  },
  {
    match: '系统内置角色不可删除',
    reason: 'SYSTEM_ROLE_LOCKED',
    hint: '只能删除没有成员的自定义角色。'
  },
  {
    match: '系统内置超级管理员角色权限不可修改',
    reason: 'SYSTEM_ROLE_LOCKED',
    hint: '超级管理员权限不可通过此工具修改。'
  },
  {
    match: '存在已分配成员的角色',
    reason: 'ROLE_HAS_MEMBERS',
    hint: '请先 remove_role_member 解绑全部成员后再删除。'
  },
  {
    match: '用户至少需要保留一个角色',
    reason: 'ROLE_REQUIRED',
    hint: '该用户只剩此角色，无法解绑。请先 assign_user_roles 补其他角色。'
  },
  {
    match: '系统至少需要保留一名超级管理员',
    reason: 'SUPER_ADMIN_REQUIRED',
    hint: '不能移除最后一名超级管理员。'
  },
  {
    match: '部分用户不存在或已删除',
    reason: 'USER_ID_INVALID',
    hint: '请先 query_users_list，使用返回的用户 id。'
  }
]

async function ensurePermissionCodesExist(
  codes: string[] | undefined,
  config: RunnableConfig | undefined
): Promise<string | undefined> {
  if (!codes || codes.length === 0) return undefined
  const raw = await executeApiCall(config, () => roleControllerListPermissions())
  if (isToolFailureResult(raw)) return raw
  const catalog = parsePermissionCatalog(raw)
  if (!catalog) return undefined
  const known = new Set(catalog.map((item) => item.code))
  const missing = [...new Set(codes.map((code) => code.trim()).filter(Boolean))].filter(
    (code) => !known.has(code)
  )
  if (missing.length > 0) return unknownPermissionCodesResult(missing, catalog)
  return undefined
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
      '查询角色列表，可通过关键字（名称/编码）、持久化状态 status、派生展示状态 effectiveStatus（active/disabled/expired/locked）、数据范围筛选并分页。',
    schema: rolesQuerySchema
  }
)

export const createRoleTool = tool(
  async (input, config) => {
    const blocked = await ensurePermissionCodesExist(input.permissionCodes, config)
    if (blocked) return blocked
    return executeApiCallOrRecover(
      config,
      () =>
        roleControllerCreate(
          asSdkOptions({
            body: input
          })
        ),
      ROLE_WRITE_HINTS
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
    executeApiCall(config, () =>
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
    executeApiCallOrRecover(
      config,
      () =>
        roleControllerUpdate(
          asSdkOptions({
            path: { id },
            body: data
          })
        ),
      ROLE_WRITE_HINTS
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
    executeApiCallOrRecover(
      config,
      () =>
        roleControllerClone(
          asSdkOptions({
            path: { id },
            body: data
          })
        ),
      ROLE_WRITE_HINTS
    ),
  {
    name: 'clone_role',
    description:
      '基于已有角色克隆（复制权限、数据范围与图标，不复制成员）。需提供新编码与名称。系统角色不可克隆。',
    schema: cloneRoleToolSchema
  }
)

export const listPermissionsTool = tool(
  async (_input, config) => executeApiCall(config, () => roleControllerListPermissions()),
  {
    name: 'query_permissions_list',
    description:
      '获取按模块分组的权限目录（含 deprecated 标记）。' +
      '创建角色或 assign_role_permissions 前必须先调用，只使用 status=active 的 code。',
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
    executeApiCallOrRecover(
      config,
      () =>
        roleControllerAddMembers(
          asSdkOptions({
            path: { id },
            body: { userIds }
          })
        ),
      ROLE_WRITE_HINTS
    ),
  {
    name: 'add_role_members',
    description: '将一个或多个用户追加绑定到指定角色',
    schema: addRoleMembersToolSchema
  }
)

export const removeRoleMemberTool = tool(
  async ({ id, userId }, config) =>
    executeApiCallOrRecover(
      config,
      () => roleControllerRemoveMember({ path: { id, userId } }),
      ROLE_WRITE_HINTS
    ),
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
    return executeApiCallOrRecover(
      config,
      () =>
        roleControllerAssignPermissions(
          asSdkOptions({
            path: { id },
            body: { permissionCodes, baseVersion }
          })
        ),
      ROLE_WRITE_HINTS
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
    executeApiCallOrRecover(
      config,
      () =>
        roleControllerAssignDataScope(
          asSdkOptions({
            path: { id },
            body: { dataScope, customOrgIds, baseVersion }
          })
        ),
      ROLE_WRITE_HINTS
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
    executeApiCallOrRecover(
      config,
      () =>
        roleControllerRemoveMany(
          asSdkOptions({
            body: { ids }
          })
        ),
      ROLE_WRITE_HINTS
    ),
  {
    name: 'delete_roles',
    description: '批量删除角色。系统内置角色或仍有成员的角色不可删除。该操作需要用户确认后才能执行',
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
