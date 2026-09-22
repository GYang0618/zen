import { useRenderTool } from '@copilotkit/react-core/v2'
import { rolesPageSchema, rolesQueryToolSchema } from '@zen/shared'

import { parseToolResult } from '../../lib/parse-tool-result'
import { RolesList } from './roles-list'

export function useRolesRenderers() {
  useRenderTool({
    name: 'query_roles_list',
    parameters: rolesQueryToolSchema,
    render: ({ parameters, status, result }) => {
      try {
        if (status === 'inProgress')
          return <span className="shimmer">正在准备角色列表查询参数...</span>
        const meta = (
          parameters as { meta?: { title?: string; description?: string; display?: boolean } }
        )?.meta
        if (meta?.display === false) return null

        if (status === 'executing') return <span className="shimmer">正在查询角色列表...</span>
        if (status === 'complete') {
          const data = parseToolResult(result, rolesPageSchema)
          if (data?.items?.length === 0) return null
          return (
            <RolesList
              title={meta?.title ?? '角色查询结果'}
              description={meta?.description}
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
