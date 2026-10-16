import {
  createJobProfileSchema,
  jobProfilesQueryToolSchema,
  postStatisticsToolSchema,
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
  postControllerGetStatistics,
  postControllerRemove,
  postControllerUpdate
} from '@/api'

const jobProfileIdSchema = z.object({
  id: z.string().min(1, '岗位目录 ID 不能为空').describe('岗位目录 ID')
})

const updateJobProfileToolSchema = jobProfileIdSchema.extend(updateJobProfileSchema.shape)

export const getJobProfilesTool = tool(
  async (input, config) => {
    const { meta: _meta, ...query } = input
    return executeApiCall(config, async (_context) =>
      postControllerFindAll(
        asSdkOptions({
          query
        })
      )
    )
  },
  {
    name: 'query_job_profiles_list',
    description:
      '分页查询岗位目录（可按关键字、状态 active/disabled、职级 P5–P8 筛选）。' +
      '创建新岗位前应先调用以避免编码冲突；组织关联编制前获取 jobProfileId。' +
      '仅能关联尚未挂到该组织的启用岗位。给用户任职请用编制 id，不要用本列表的 id。' +
      'meta.display 只在用户要看的就是本次返回的这份列表时为 true；取证、归类、统计、为后续办理查数时为 false。',
    schema: jobProfilesQueryToolSchema
  }
)

export const createJobProfileTool = tool(
  async (input, config) =>
    executeApiCall(config, () =>
      postControllerCreate(
        asSdkOptions({
          body: input
        })
      )
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
    executeApiCall(config, async (_context) =>
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
    executeApiCall(config, () =>
      postControllerUpdate(
        asSdkOptions({
          path: { id },
          body: data
        })
      )
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
    executeApiCall(config, () =>
      postControllerRemove({
        path: { id }
      })
    ),
  {
    name: 'delete_job_profile',
    description:
      '删除岗位目录。已关联组织编制的岗位不可删除，请先 remove_organization_position 解除关联，或改为停用。',
    schema: jobProfileIdSchema
  }
)

export const getPostStatisticsTool = tool(
  async (input, config) => {
    const { meta: _meta, ...query } = input
    return executeApiCall(config, async (_context) =>
      postControllerGetStatistics({
        query
      })
    )
  },
  {
    name: 'query_post_statistics',
    description:
      '查询岗位与编制多维度聚合统计数据（岗位目录总数、启停分布、职级分布、岗位族分布以及组织岗位编制的规划人数、实际在岗人数、满编/缺编/超编/空置编制情况）。' +
      '生成人岗编制分析、职级分布报表时优先使用本工具，严禁多次翻页遍历 query_job_profiles_list 手动累加。' +
      '可传 organizationId 按特定组织筛选编制统计范围。',
    schema: postStatisticsToolSchema
  }
)

export const postTools = [
  getJobProfilesTool,
  getPostStatisticsTool,
  createJobProfileTool,
  getJobProfileTool,
  updateJobProfileTool,
  deleteJobProfileTool
] as const
