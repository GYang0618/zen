import { useFrontendTool } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import { usersQuerySchema } from '@zen/shared'

/**用户查询 */
export function useUserQueryTool() {
  const navigate = useNavigate()
  useFrontendTool({
    name: 'query_user_list',
    description: '执行用户列表查询，可以通过关键字、用户状态、角色等条件进行查询',
    parameters: usersQuerySchema,
    handler: async ({ keyword, status, role, page, pageSize }) => {
      navigate({
        to: '/system/users',
        search: {
          keyword,
          status,
          role,
          page,
          pageSize
        }
      })
      return '已在前端界面为你输入查询条件，并进行查询'
    }
  })
}
