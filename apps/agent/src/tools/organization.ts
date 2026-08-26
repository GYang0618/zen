import {
  addOrganizationMemberSchema,
  changeOrganizationParentSchema,
  createOrganizationSchema,
  findJobProfilesQuerySchema,
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
  organizationControllerUpdateTypeCatalog,
  postControllerFindAll
} from '../api'

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

export const getOrganizationTreeTool = tool(
  async (_input, config) => executeApiCall(config, () => organizationControllerGetTree()),
  {
    name: 'query_organization_tree',
    description:
      '获取按名称排序的组织树（公司/集团/事业部/分支机构/中心/部门/团队/项目组）。',
    schema: z.object({})
  }
)

export const getOrganizationTypeCatalogTool = tool(
  async (_input, config) => executeApiCall(config, () => organizationControllerGetTypeCatalog()),
  {
    name: 'query_organization_type_catalog',
    description:
      '获取本企业组织类型目录（各类型开关、显示名称、是否必选、可否作为根组织）以及当前已在使用的类型。' +
      '更新目录前应先调用本工具，确保提交完整的全部类型列表。',
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
      '更新本企业组织类型开关与显示名称。items 必须包含全部组织类型；必选类型不可关闭。' +
      '先 query_organization_type_catalog，再提交完整 items。',
    schema: updateOrganizationTypeCatalogSchema
  }
)

export const createOrganizationTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
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
      '仅允许符合层级规则的类型；根组织仅限 group/company/center。',
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
    executeApiCall(config, () =>
      organizationControllerUpdate(
        asSdkOptions({
          path: { id },
          body: data
        })
      )
    ),
  {
    name: 'update_organization_info',
    description: '更新指定组织的名称、类型、生效日期或描述（不含负责人与父级）',
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
      '仅变更组织父级，不支持手工排序；parentId 为 null 表示设为根组织（仅 group/company/center）',
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

export const listJobProfilesTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      postControllerFindAll(
        asSdkOptions({
          query: {
            ...(input.page !== undefined ? { page: Number(input.page) } : {}),
            ...(input.pageSize !== undefined ? { pageSize: Number(input.pageSize) } : {}),
            ...(input.keyword !== undefined ? { keyword: input.keyword } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.level !== undefined ? { level: input.level } : {})
          }
        })
      )
    ),
  {
    name: 'query_job_profiles',
    description:
      '分页查询岗位目录（可按关键字、状态、职级筛选）。' +
      '组织关联编制前应先调用本工具获取 jobProfileId；仅能关联尚未挂到该组织的岗位。',
    schema: findJobProfilesQuerySchema
  }
)

export const listPositionsTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () => organizationControllerListPositions({ path: { id } })),
  {
    name: 'query_organization_positions',
    description: '查询指定组织下的岗位编制列表（含编制人数、在岗人数、成员预览）',
    schema: organizationIdSchema
  }
)

export const createPositionTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCall(config, () =>
      organizationControllerCreatePosition(
        asSdkOptions({
          path: { id },
          body: data
        })
      )
    ),
  {
    name: 'create_organization_position',
    description:
      '将已有岗位目录关联到指定组织并设置编制人数。jobProfileId 来自 query_job_profiles。' +
      '可覆盖职级 level 与编制说明 description。',
    schema: createPositionToolSchema
  }
)

export const updatePositionTool = tool(
  async ({ id, positionId, ...data }, config) =>
    executeApiCall(config, () =>
      organizationControllerUpdatePosition(
        asSdkOptions({
          path: { id, positionId },
          body: data
        })
      )
    ),
  {
    name: 'update_organization_position',
    description: '更新组织岗位编制：编制人数、职级、说明或状态（active/frozen）',
    schema: updatePositionToolSchema
  }
)

export const removePositionTool = tool(
  async ({ id, positionId }, config) =>
    executeApiCall(config, () =>
      organizationControllerRemovePosition({
        path: { id, positionId }
      })
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
  listJobProfilesTool,
  listPositionsTool,
  createPositionTool,
  updatePositionTool,
  removePositionTool,
  listOrganizationActivitiesTool
] as const
