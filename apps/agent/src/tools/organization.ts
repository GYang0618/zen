import {
  addOrganizationMemberSchema,
  changeOrganizationParentSchema,
  createOrganizationSchema,
  linkOrganizationPositionSchema,
  organizationActivitiesQuerySchema,
  updateOrganizationLeaderSchema,
  updateOrganizationSchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import { client, executeApiCall } from '../api'

const organizationIdSchema = z.object({
  id: z.string().min(1, '组织 ID 不能为空')
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
const listActivitiesToolSchema = organizationIdSchema.extend(
  organizationActivitiesQuerySchema.shape
)

export const getOrganizationTreeTool = tool(
  async (_input, config) =>
    executeApiCall(config, () => client.get({ url: '/api/organizations/tree' })),
  {
    name: 'query_organization_tree',
    description:
      '获取按名称排序的组织树（公司/集团/事业部/分支机构/中心/部门/团队/项目组）。' +
      '结果会由前端树形 UI 展示；你只需在最终回复中用一两句话概括节点规模或结论，不要重复输出整棵树。',
    schema: z.object({})
  }
)

export const createOrganizationTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      client.post({
        url: '/api/organizations',
        body: input,
        headers: { 'Content-Type': 'application/json' }
      })
    ),
  {
    name: 'create_organization',
    description: '创建组织节点，可指定父节点、负责人和生效日期；仅允许符合层级规则的类型',
    schema: createOrganizationSchema
  }
)

export const getOrganizationTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () => client.get({ url: `/api/organizations/${id}` })),
  {
    name: 'query_organization_detail',
    description: '根据组织 ID 查询单个组织详情',
    schema: organizationIdSchema
  }
)

export const updateOrganizationTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCall(config, () =>
      client.patch({
        url: `/api/organizations/${id}`,
        body: data,
        headers: { 'Content-Type': 'application/json' }
      })
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
      client.patch({
        url: `/api/organizations/${id}/leader`,
        body: { leaderId },
        headers: { 'Content-Type': 'application/json' }
      })
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
      client.patch({
        url: `/api/organizations/${id}/parent`,
        body: { parentId },
        headers: { 'Content-Type': 'application/json' }
      })
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
    executeApiCall(config, () => client.get({ url: `/api/organizations/${id}/members` })),
  {
    name: 'query_organization_members',
    description: '查询指定组织的成员列表',
    schema: organizationIdSchema
  }
)

export const addOrganizationMemberTool = tool(
  async ({ id, userIds }, config) =>
    executeApiCall(config, () =>
      client.post({
        url: `/api/organizations/${id}/members`,
        body: { userIds },
        headers: { 'Content-Type': 'application/json' }
      })
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
      client.delete({ url: `/api/organizations/${id}/members/${userId}` })
    ),
  {
    name: 'remove_organization_member',
    description: '从指定组织中移除成员',
    schema: removeOrganizationMemberToolSchema
  }
)

export const listPositionsTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () => client.get({ url: `/api/organizations/${id}/positions` })),
  {
    name: 'query_organization_positions',
    description: '查询指定组织下的岗位列表',
    schema: organizationIdSchema
  }
)

export const createPositionTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCall(config, () =>
      client.post({
        url: `/api/organizations/${id}/positions`,
        body: data,
        headers: { 'Content-Type': 'application/json' }
      })
    ),
  {
    name: 'create_organization_position',
    description: '将已有岗位目录关联到指定组织，并设置编制人数',
    schema: createPositionToolSchema
  }
)

export const listOrganizationActivitiesTool = tool(
  async ({ id, page, pageSize }, config) =>
    executeApiCall(config, () =>
      client.get({
        url: `/api/organizations/${id}/activities`,
        query: { page, pageSize }
      })
    ),
  {
    name: 'query_organization_activities',
    description: '分页查询指定组织的活动流',
    schema: listActivitiesToolSchema
  }
)

export const organizationTools = [
  getOrganizationTreeTool,
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
  listOrganizationActivitiesTool
] as const
