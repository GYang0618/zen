import { useRenderTool } from '@copilotkit/react-core/v2'
import { usersPageSchema, usersQueryToolSchema } from '@zen/shared'

import { parseToolResult } from '../../lib/parse-tool-result'
import { UsersList } from './users-list'

export function useUsersRenderers() {
  useRenderTool({
    name: 'query_users_list',
    parameters: usersQueryToolSchema,
    render: ({ parameters, status, result }) => {
      try {
        if (status === 'inProgress')
          return <span className="shimmer">正在准备用户列表查询参数...</span>
        const { title, description, display } = parameters.meta
        if (display === false) return null

        if (status === 'executing') return <span className="shimmer">正在查询用户列表...</span>
        if (status === 'complete') {
          const data = parseToolResult(result, usersPageSchema)
          if (data?.items?.length === 0) return null
          return (
            <UsersList
              title={title}
              description={description}
              data={data?.items ?? []}
              pagination={data?.pagination}
            />
          )
        }
        return null
      } catch (error) {
        console.error(error)
        return null
      }
    }
  })
}
