import { useFrontendTool } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import { findJobProfilesQuerySchema } from '@zen/shared'

/** 将岗位目录查询条件同步到岗位管理页 */
export function useJobProfileQueryTool() {
  const navigate = useNavigate()
  useFrontendTool({
    name: 'query_job_profile_list',
    description: '执行岗位目录列表查询，可通过关键字、状态等条件筛选',
    parameters: findJobProfilesQuerySchema,
    handler: async ({ keyword, status, page, pageSize }) => {
      navigate({
        to: '/system/posts',
        search: {
          keyword,
          status,
          page,
          pageSize
        }
      })
      return '已在前端界面为你输入查询条件，并进行查询'
    }
  })
}
