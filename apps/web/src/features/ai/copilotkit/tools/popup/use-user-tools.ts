import { useFrontendTool } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import { usersQuerySchema } from '@zen/shared'

export function useUserTools() {
  useUserQueryTool()
}

/**用户查询 */
function useUserQueryTool() {
  const navigate = useNavigate()
  useFrontendTool({
    name: 'query_user_list',
    description: '用户列表查询，可以通过关键字、用户状态、角色等条件进行查询',
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
      return {
        status: 'success',
        message: '查询成功，请在用户列表页查看结果'
      }
    }
  })
}
