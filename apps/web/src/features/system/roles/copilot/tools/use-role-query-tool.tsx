import { useFrontendTool } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import { rolesQuerySchema } from '@zen/shared'

/** 角色列表查询：写入 URL search，驱动左侧列表与筛选 */
export function useRoleQueryTool() {
  const navigate = useNavigate()
  useFrontendTool({
    name: 'query_role_list',
    description: '执行角色列表查询，可通过关键字、状态、数据范围等条件进行筛选',
    parameters: rolesQuerySchema,
    handler: async ({ keyword, status, dataScope, page, pageSize }) => {
      navigate({
        to: '/system/roles',
        search: {
          keyword,
          status,
          dataScope,
          page,
          pageSize
        }
      })
      return '已在前端界面为你输入查询条件，并进行查询'
    }
  })
}
