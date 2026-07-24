import {
  createOrganizationSchema,
  createPostSchema,
  deleteOrganizationsSchema,
  moveOrganizationSchema,
  updateOrganizationSchema,
  updatePostSchema,
  upsertOrganizationMemberSchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import {
  executeApiCall,
  organizationControllerCreate,
  organizationControllerCreatePost,
  organizationControllerDeletePost,
  organizationControllerFindOne,
  organizationControllerGetTree,
  organizationControllerListMembers,
  organizationControllerListPosts,
  organizationControllerMove,
  organizationControllerRemove,
  organizationControllerRemoveMember,
  organizationControllerUpdate,
  organizationControllerUpdatePost,
  organizationControllerUpsertMember
} from '../api'

const organizationIdSchema = z.object({
  id: z.string().min(1, '组织 ID 不能为空')
})

const updateOrganizationToolSchema = organizationIdSchema.extend(updateOrganizationSchema.shape)
const moveOrganizationToolSchema = organizationIdSchema.extend(moveOrganizationSchema.shape)
const upsertOrganizationMemberToolSchema = organizationIdSchema.extend(
  upsertOrganizationMemberSchema.shape
)
const removeOrganizationMemberToolSchema = organizationIdSchema.extend({
  userId: z.string().min(1, '用户 ID 不能为空').describe('要移除的用户 ID')
})

const listPostsQuerySchema = z.object({
  organizationId: z.string().trim().min(1).optional().describe('按组织 ID 筛选岗位，不传则返回全部')
})

const postIdSchema = z.object({
  postId: z.string().min(1, '岗位 ID 不能为空')
})

const updatePostToolSchema = postIdSchema.extend(updatePostSchema.shape)

/** OpenAPI 未完整生成 body/query 时的调用参数断言 */
function asSdkOptions<T>(options: object): T {
  return options as T
}

export const getOrganizationTreeTool = tool(
  async (_input, config) => executeApiCall(config, () => organizationControllerGetTree()),
  {
    name: 'query_organization_tree',
    description:
      '获取组织树结构（含公司、分支、部门、小组层级）。' +
      '结果会由前端树形 UI 展示；你只需在最终回复中用一两句话概括节点规模或结论，不要重复输出整棵树。',
    schema: z.object({})
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
    description: '创建组织节点（公司/分支/部门/小组），可指定父节点与负责人',
    schema: createOrganizationSchema
  }
)

export const getOrganizationTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () =>
      organizationControllerFindOne({
        path: { id }
      })
    ),
  {
    name: 'query_organization_detail',
    description: '根据组织 ID 查询单个组织详情',
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
    description: '更新指定组织的基本信息、状态、负责人等（不含移动父节点）',
    schema: updateOrganizationToolSchema
  }
)

export const moveOrganizationTool = tool(
  async ({ id, parentId }, config) =>
    executeApiCall(config, () =>
      organizationControllerMove(
        asSdkOptions({
          path: { id },
          body: { parentId }
        })
      )
    ),
  {
    name: 'move_organization',
    description: '移动组织节点（变更父节点并重算 path）；parentId 为 null 表示升为根节点',
    schema: moveOrganizationToolSchema
  }
)

export const listOrganizationMembersTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () =>
      organizationControllerListMembers({
        path: { id }
      })
    ),
  {
    name: 'query_organization_members',
    description: '查询指定组织的成员列表',
    schema: organizationIdSchema
  }
)

export const upsertOrganizationMemberTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCall(config, () =>
      organizationControllerUpsertMember(
        asSdkOptions({
          path: { id },
          body: data
        })
      )
    ),
  {
    name: 'upsert_organization_member',
    description: '添加或更新组织成员（可设置是否主职、岗位）',
    schema: upsertOrganizationMemberToolSchema
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

export const listPostsTool = tool(
  async ({ organizationId }, config) =>
    executeApiCall(config, () =>
      organizationControllerListPosts(
        asSdkOptions({
          query: organizationId ? { organizationId } : undefined
        })
      )
    ),
  {
    name: 'query_posts_list',
    description: '查询岗位列表，可按组织 ID 筛选',
    schema: listPostsQuerySchema
  }
)

export const createPostTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      organizationControllerCreatePost(
        asSdkOptions({
          body: input
        })
      )
    ),
  {
    name: 'create_post',
    description: '在指定组织下创建岗位',
    schema: createPostSchema
  }
)

export const updatePostTool = tool(
  async ({ postId, ...data }, config) =>
    executeApiCall(config, () =>
      organizationControllerUpdatePost(
        asSdkOptions({
          path: { postId },
          body: data
        })
      )
    ),
  {
    name: 'update_post_info',
    description: '更新岗位信息或状态',
    schema: updatePostToolSchema
  }
)

export const deletePostTool = tool(
  async ({ postId }, config) =>
    executeApiCall(config, () =>
      organizationControllerDeletePost({
        path: { postId }
      })
    ),
  {
    name: 'delete_post',
    description: '删除指定岗位；该操作需要用户确认后才能执行',
    schema: postIdSchema
  }
)

export const deleteOrganizationsTool = tool(
  async ({ ids }, config) =>
    executeApiCall(config, () =>
      organizationControllerRemove(
        asSdkOptions({
          body: { ids }
        })
      )
    ),
  {
    name: 'delete_organizations',
    description: '删除一个或多个组织（要求无子节点且无成员）；该操作需要用户确认后才能执行',
    schema: deleteOrganizationsSchema
  }
)

export const organizationTools = [
  getOrganizationTreeTool,
  createOrganizationTool,
  getOrganizationTool,
  updateOrganizationTool,
  moveOrganizationTool,
  listOrganizationMembersTool,
  upsertOrganizationMemberTool,
  removeOrganizationMemberTool,
  listPostsTool,
  createPostTool,
  updatePostTool,
  deletePostTool,
  deleteOrganizationsTool
] as const
