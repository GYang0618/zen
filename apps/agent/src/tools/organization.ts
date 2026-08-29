import {
  addOrganizationMemberSchema,
  changeOrganizationParentSchema,
  createOrganizationSchema,
  linkOrganizationPositionSchema,
  organizationActivitiesQuerySchema,
  updateOrganizationLeaderSchema,
  updateOrganizationPositionSchema,
  updateOrganizationSchema,
  updateOrganizationTypeCatalogSchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import {
  asSdkOptions,
  executeApiCall,
  organizationControllerAddMember,
  organizationControllerChangeParent,
  organizationControllerCreate,
  organizationControllerCreatePosition,
  organizationControllerFindOne,
  organizationControllerGetTree,
  organizationControllerGetTypeCatalog,
  organizationControllerListActivities,
  organizationControllerListMembers,
  organizationControllerListPositions,
  organizationControllerRemoveMember,
  organizationControllerRemovePosition,
  organizationControllerUpdate,
  organizationControllerUpdateLeader,
  organizationControllerUpdatePosition,
  organizationControllerUpdateTypeCatalog
} from '../api'
import {
  organizationTypeDisabledResult,
  parseOrganizationTypeCatalogItems
} from './organization-type-guard'
import { executeApiCallOrRecover, isToolFailureResult } from './recoverable-error'

import type { RunnableConfig } from '@langchain/core/runnables'
import type { RecoverableHint } from './recoverable-error'

const organizationIdSchema = z.object({
  id: z.string().min(1, '组织 ID 不能为空').describe('组织 ID')
})

const updateOrganizationToolSchema = organizationIdSchema.extend(updateOrganizationSchema.shape)
const updateOrganizationLeaderToolSchema = organizationIdSchema.extend(
  updateOrganizationLeaderSchema.shape
)
const changeOrganizationParentToolSchema = organizationIdSchema.extend(
  changeOrganizationParentSchema.shape
)
const addOrganizationMemberToolSchema = organizationIdSchema.extend(
  addOrganizationMemberSchema.shape
)
const removeOrganizationMemberToolSchema = organizationIdSchema.extend({
  userId: z.string().min(1, '用户 ID 不能为空').describe('要移除的用户 ID')
})
const createPositionToolSchema = organizationIdSchema.extend(linkOrganizationPositionSchema.shape)
const updatePositionToolSchema = organizationIdSchema
  .extend({
    positionId: z.string().min(1, '岗位编制 ID 不能为空').describe('组织岗位编制 ID')
  })
  .extend(updateOrganizationPositionSchema.shape)
const removePositionToolSchema = organizationIdSchema.extend({
  positionId: z.string().min(1, '岗位编制 ID 不能为空').describe('组织岗位编制 ID')
})
const listActivitiesToolSchema = organizationIdSchema.extend(
  organizationActivitiesQuerySchema.shape
)

const POSITION_WRITE_HINTS: RecoverableHint[] = [
  {
    match: '岗位目录不存在或已停用',
    reason: 'JOB_PROFILE_UNAVAILABLE',
    hint: '请先 query_job_profiles_list（status=active），使用返回的 id 作为 jobProfileId。'
  },
  {
    match: '该组织已关联此岗位',
    reason: 'JOB_PROFILE_ALREADY_LINKED',
    hint: '请先 query_organization_positions，不要重复关联；给用户任职请用已有编制 id。'
  },
  {
    match: '编制人数不能小于当前在岗人数',
    reason: 'HEADCOUNT_TOO_SMALL',
    hint: 'headcount 不能小于当前在岗人数，请先 query_organization_positions 查看 activeCount。'
  },
  {
    match: '仍有在岗人员，无法解除岗位关联',
    reason: 'POSITION_HAS_MEMBERS',
    hint: '请先把该编制上的用户调到其他岗位或清空 postId，再解除关联。'
  }
]

const ORG_TYPE_WRITE_HINTS: RecoverableHint[] = [
  {
    match: '该组织类型未在本企业启用',
    reason: 'ORG_TYPE_DISABLED',
    hint: '请先 query_organization_type_catalog，再用 update_organization_type_catalog 打开该类型后重试。'
  }
]

async function ensureOrganizationTypeEnabled(
  type: string | undefined,
  config: RunnableConfig | undefined
): Promise<string | undefined> {
  if (!type) return undefined
  const raw = await executeApiCall(config, () => organizationControllerGetTypeCatalog())
  if (isToolFailureResult(raw)) return raw
  const items = parseOrganizationTypeCatalogItems(raw)
  if (!items) return undefined
  const item = items.find((entry) => entry.type === type)
  if (item && !item.enabled) return organizationTypeDisabledResult(type, items)
  return undefined
}

async function createOrUpdateOrganization(
  config: RunnableConfig | undefined,
  type: string | undefined,
  call: () => Promise<unknown>
): Promise<string> {
  const blocked = await ensureOrganizationTypeEnabled(type, config)
  if (blocked) return blocked
  return executeApiCall(config, call, ORG_TYPE_WRITE_HINTS)
}

export const getOrganizationTreeTool = tool(
  async (_input, config) => executeApiCall(config, () => organizationControllerGetTree()),
  {
    name: 'query_organization_tree',
    description:
      '获取按名称排序的组织树。节点类型以本企业已启用目录为准，创建前请先 query_organization_type_catalog。',
    schema: z.object({})
  }
)

export const getOrganizationTypeCatalogTool = tool(
  async (_input, config) => executeApiCall(config, () => organizationControllerGetTypeCatalog()),
  {
    name: 'query_organization_type_catalog',
    description:
      '获取本企业组织类型目录（各类型开关、显示名称、是否必选、可否作为根组织）以及当前已在使用的类型。' +
      '创建或修改组织类型前必须先调用；更新目录时须提交本工具返回的完整 items。',
    schema: z.object({})
  }
)

export const updateOrganizationTypeCatalogTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      organizationControllerUpdateTypeCatalog(
        asSdkOptions({
          body: input
        })
      )
    ),
  {
    name: 'update_organization_type_catalog',
    description:
      '更新本企业组织类型开关与显示名称。items 必须包含全部组织类型；必选类型 company/department/team 不可关闭。' +
      '先 query_organization_type_catalog，再基于返回的完整 items 把所需类型 enabled 设为 true，其余保持原样。',
    schema: updateOrganizationTypeCatalogSchema
  }
)

export const createOrganizationTool = tool(
  async (input, config) =>
    createOrUpdateOrganization(config, input.type, () =>
      organizationControllerCreate(
        asSdkOptions({
          body: input
        })
      )
    ),
  {
    name: 'create_organization',
    description:
      '创建组织节点，可指定父节点、负责人和生效日期。编码创建后不可修改。' +
      '创建前必须 query_organization_type_catalog，type 只能用 enabled=true 的类型。' +
      '需要未启用类型时先 update_organization_type_catalog 打开。' +
      '根组织仅限已启用的 group/company。',
    schema: createOrganizationSchema
  }
)

export const getOrganizationTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () => organizationControllerFindOne({ path: { id } })),
  {
    name: 'query_organization_detail',
    description: '根据组织 ID 查询单个组织详情（含负责人、成员数、岗位编制数）',
    schema: organizationIdSchema
  }
)

export const updateOrganizationTool = tool(
  async ({ id, ...data }, config) =>
    createOrUpdateOrganization(config, data.type, () =>
      organizationControllerUpdate(
        asSdkOptions({
          path: { id },
          body: data
        })
      )
    ),
  {
    name: 'update_organization_info',
    description:
      '更新指定组织的名称、类型、生效日期或描述（不含负责人与父级）。' +
      '若修改 type，须先 query_organization_type_catalog，且只能改为已启用类型。',
    schema: updateOrganizationToolSchema
  }
)

export const updateOrganizationLeaderTool = tool(
  async ({ id, leaderId }, config) =>
    executeApiCall(config, () =>
      organizationControllerUpdateLeader(
        asSdkOptions({
          path: { id },
          body: { leaderId }
        })
      )
    ),
  {
    name: 'update_organization_leader',
    description: '变更组织负责人；leaderId 为 null 表示清空负责人',
    schema: updateOrganizationLeaderToolSchema
  }
)

export const changeOrganizationParentTool = tool(
  async ({ id, parentId }, config) =>
    executeApiCall(config, () =>
      organizationControllerChangeParent(
        asSdkOptions({
          path: { id },
          body: { parentId }
        })
      )
    ),
  {
    name: 'change_organization_parent',
    description:
      '仅变更组织父级，不支持手工排序；parentId 为 null 表示设为根组织（仅已启用的 group/company）',
    schema: changeOrganizationParentToolSchema
  }
)

export const listOrganizationMembersTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () => organizationControllerListMembers({ path: { id } })),
  {
    name: 'query_organization_members',
    description: '查询指定组织的成员列表',
    schema: organizationIdSchema
  }
)

export const addOrganizationMemberTool = tool(
  async ({ id, userIds }, config) =>
    executeApiCall(config, () =>
      organizationControllerAddMember(
        asSdkOptions({
          path: { id },
          body: { userIds }
        })
      )
    ),
  {
    name: 'add_organization_member',
    description: '将一名或多名用户加入指定组织',
    schema: addOrganizationMemberToolSchema
  }
)

export const removeOrganizationMemberTool = tool(
  async ({ id, userId }, config) =>
    executeApiCall(config, () =>
      organizationControllerRemoveMember({
        path: { id, userId }
      })
    ),
  {
    name: 'remove_organization_member',
    description: '从指定组织中移除成员',
    schema: removeOrganizationMemberToolSchema
  }
)

export const listPositionsTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () => organizationControllerListPositions({ path: { id } })),
  {
    name: 'query_organization_positions',
    description:
      '查询指定组织下的岗位编制列表（含编制人数、在岗人数、成员预览）。给用户任职时 postId 必须使用本列表的 id。',
    schema: organizationIdSchema
  }
)

export const createPositionTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCallOrRecover(
      config,
      () =>
        organizationControllerCreatePosition(
          asSdkOptions({
            path: { id },
            body: data
          })
        ),
      POSITION_WRITE_HINTS
    ),
  {
    name: 'create_organization_position',
    description:
      '将已有岗位目录关联到指定组织并设置编制人数。jobProfileId 来自 query_job_profiles_list（须启用且尚未挂到该组织）。' +
      '可覆盖职级 level 与编制说明 description。给用户任职请用返回的编制 id，不要把 jobProfileId 当作 postId。',
    schema: createPositionToolSchema
  }
)

export const updatePositionTool = tool(
  async ({ id, positionId, ...data }, config) =>
    executeApiCallOrRecover(
      config,
      () =>
        organizationControllerUpdatePosition(
          asSdkOptions({
            path: { id, positionId },
            body: data
          })
        ),
      POSITION_WRITE_HINTS
    ),
  {
    name: 'update_organization_position',
    description: '更新组织岗位编制：编制人数、职级、说明或状态（active/frozen）',
    schema: updatePositionToolSchema
  }
)

export const removePositionTool = tool(
  async ({ id, positionId }, config) =>
    executeApiCallOrRecover(
      config,
      () =>
        organizationControllerRemovePosition({
          path: { id, positionId }
        }),
      POSITION_WRITE_HINTS
    ),
  {
    name: 'remove_organization_position',
    description: '解除组织与岗位目录的编制关联（不删除岗位目录本身）',
    schema: removePositionToolSchema
  }
)

export const listOrganizationActivitiesTool = tool(
  async ({ id, page, pageSize }, config) =>
    executeApiCall(config, () =>
      organizationControllerListActivities(
        asSdkOptions({
          path: { id },
          query: { page, pageSize }
        })
      )
    ),
  {
    name: 'query_organization_activities',
    description: '分页查询指定组织的活动流',
    schema: listActivitiesToolSchema
  }
)

export const organizationTools = [
  getOrganizationTreeTool,
  getOrganizationTypeCatalogTool,
  updateOrganizationTypeCatalogTool,
  createOrganizationTool,
  getOrganizationTool,
  updateOrganizationTool,
  updateOrganizationLeaderTool,
  changeOrganizationParentTool,
  listOrganizationMembersTool,
  addOrganizationMemberTool,
  removeOrganizationMemberTool,
  listPositionsTool,
  createPositionTool,
  updatePositionTool,
  removePositionTool,
  listOrganizationActivitiesTool
] as const
