import {
  createJobProfileSchema,
  findJobProfilesQuerySchema,
  updateJobProfileSchema
} from '@zen/shared'
import { tool } from 'langchain'
import { z } from 'zod'

import {
  asSdkOptions,
  executeApiCall,
  postControllerCreate,
  postControllerFindAll,
  postControllerFindOne,
  postControllerRemove,
  postControllerUpdate
} from '../api'
import { executeApiCallOrRecover } from './recoverable-error'

import type { RecoverableHint } from './recoverable-error'

const jobProfileIdSchema = z.object({
  id: z.string().min(1, '岗位目录 ID 不能为空').describe('岗位目录 ID')
})

const updateJobProfileToolSchema = jobProfileIdSchema.extend(updateJobProfileSchema.shape)

const POST_WRITE_HINTS: RecoverableHint[] = [
  {
    match: '岗位编码已存在',
    reason: 'JOB_PROFILE_CODE_CONFLICT',
    hint: '请先 query_job_profiles_list，换一个未被占用的 POS-四位数字（如 POS-1001）。'
  },
  {
    match: '该岗位已关联组织编制',
    reason: 'JOB_PROFILE_IN_USE',
    hint: '请先 query_job_profile_detail，对已挂组织调用 remove_organization_position，或改为停用。'
  },
  {
    match: '岗位目录不存在或已停用',
    reason: 'JOB_PROFILE_UNAVAILABLE',
    hint: '请先 query_job_profiles_list（status=active），使用返回的 id 作为 jobProfileId。'
  },
  {
    match: '该组织已关联此岗位',
    reason: 'JOB_PROFILE_ALREADY_LINKED',
    hint: '请先 query_organization_positions，该组织已有此岗位编制则改用已有编制，不要重复关联。'
  }
]

export const getJobProfilesTool = tool(
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
    name: 'query_job_profiles_list',
    description:
      '分页查询岗位目录（可按关键字、状态 active/disabled、职级 P5–P8 筛选）。' +
      '创建新岗位前应先调用以避免编码冲突；组织关联编制前获取 jobProfileId。' +
      '仅能关联尚未挂到该组织的启用岗位。给用户任职请用编制 id，不要用本列表的 id。',
    schema: findJobProfilesQuerySchema
  }
)

export const createJobProfileTool = tool(
  async (input, config) =>
    executeApiCallOrRecover(
      config,
      () =>
        postControllerCreate(
          asSdkOptions({
            body: input
          })
        ),
      POST_WRITE_HINTS
    ),
  {
    name: 'create_job_profile',
    description:
      '创建岗位目录。创建前先 query_job_profiles_list，code 必须是未被占用的 POS-四位数字（如 POS-1001），创建后不可修改。' +
      'level 为 P5/P6/P7/P8；status 默认为 active。挂到组织请用 create_organization_position。',
    schema: createJobProfileSchema
  }
)

export const getJobProfileTool = tool(
  async ({ id }, config) =>
    executeApiCall(config, () =>
      postControllerFindOne({
        path: { id }
      })
    ),
  {
    name: 'query_job_profile_detail',
    description: '根据岗位目录 ID 查询详情，含关联组织编制列表、编制人数、在岗人数与成员预览。',
    schema: jobProfileIdSchema
  }
)

export const updateJobProfileTool = tool(
  async ({ id, ...data }, config) =>
    executeApiCallOrRecover(
      config,
      () =>
        postControllerUpdate(
          asSdkOptions({
            path: { id },
            body: data
          })
        ),
      POST_WRITE_HINTS
    ),
  {
    name: 'update_job_profile_info',
    description:
      '更新岗位目录：名称、描述、职级、岗位族、图标、图标颜色、状态。编码不可改。' +
      '停用请将 status 设为 disabled（不停用已挂组织编制）。',
    schema: updateJobProfileToolSchema
  }
)

export const deleteJobProfileTool = tool(
  async ({ id }, config) =>
    executeApiCallOrRecover(
      config,
      () =>
        postControllerRemove({
          path: { id }
        }),
      POST_WRITE_HINTS
    ),
  {
    name: 'delete_job_profile',
    description:
      '删除岗位目录。已关联组织编制的岗位不可删除，请先 remove_organization_position 解除关联，或改为停用。' +
      '该操作需要用户确认后才能执行。',
    schema: jobProfileIdSchema
  }
)

export const postTools = [
  getJobProfilesTool,
  createJobProfileTool,
  getJobProfileTool,
  updateJobProfileTool,
  deleteJobProfileTool
] as const
