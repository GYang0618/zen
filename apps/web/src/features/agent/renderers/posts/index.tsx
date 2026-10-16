import { useRenderTool } from '@copilotkit/react-core/v2'
import { jobProfilesPageSchema, jobProfilesQueryToolSchema } from '@zen/shared'

import { parseToolResult } from '../../lib/parse-tool-result'
import { PostsList } from './posts-list'

export function usePostsRenderers() {
  useRenderTool({
    name: 'query_job_profiles_list',
    parameters: jobProfilesQueryToolSchema,
    render: ({ parameters, status, result }) => {
      try {
        if (status === 'inProgress')
          return <span className="shimmer">正在准备岗位列表查询参数...</span>
        const meta = (
          parameters as { meta?: { title?: string; description?: string; display?: boolean } }
        )?.meta
        if (meta?.display === false) return null

        if (status === 'executing') return <span className="shimmer">正在查询岗位列表...</span>
        if (status === 'complete') {
          const data = parseToolResult(result, jobProfilesPageSchema)
          if (data?.items?.length === 0) return null
          return (
            <PostsList
              title={meta?.title ?? '岗位查询结果'}
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
