import { useFrontendTool } from '@copilotkit/react-core/v2'

export function useQueryRouteTool() {
  useFrontendTool({
    name: 'query_route_info',
    description: '当需要获取当前所在路由（页面）信息时，使用该工具。',
    handler: async () => {
      const { host, pathname, search } = window.location
      return {
        host,
        pathname,
        search
      }
    }
  })
}
