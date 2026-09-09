import { useRenderTool } from '@copilotkit/react-core/v2'
import { usersQuerySchema } from '@zen/shared'

import { DefaultToolCard, UserTableComponent } from '../../generative-ui'
import { parseAgentToolResult } from '../../lib/parse-agent-tool-result'

import type { User } from '@zen/shared'

interface UserListResponse {
  items?: User[]
  total?: number
}

/**
 * 针对 `query_users_list` 查询工具的就地渲染 Hook（方案一：参数意图控制）。
 * - 当 parameters.display 为 true 时：就地渲染交互式用户表格（流式中展示骨架屏，查完展示表格）。
 * - 当 parameters.display 为 false 或未传时：降级为普通折叠工具卡片，避免查组织等中间调用弹出大表格。
 */
export function useUserRenderers() {
  useRenderTool({
    name: 'query_users_list',
    parameters: usersQuerySchema,
    render: ({ parameters, status, result }) => {
      // 1. 如果并非用户意图的直接表格展示（中间步骤/查组织等），渲染折叠工具卡片
      if (!parameters?.display) {
        return (
          <DefaultToolCard
            name="query_users_list"
            parameters={parameters}
            status={status}
            result={result}
          />
        )
      }

      // 2. 意图为表格展示时，执行中展示骨架屏
      if (status === 'inProgress' || status === 'executing') {
        return <UserTableComponent isLoading={true} />
      }

      // 3. 执行完成：解析信封数据
      const parsed = parseAgentToolResult<UserListResponse>(result, { status })

      if (parsed.success && parsed.data?.items) {
        return <UserTableComponent data={parsed.data.items} isLoading={false} />
      }

      // 异常或非预期响应降级展示错误卡片
      return (
        <DefaultToolCard
          name="query_users_list"
          parameters={parameters}
          status={status}
          result={result}
        />
      )
    }
  })
}
