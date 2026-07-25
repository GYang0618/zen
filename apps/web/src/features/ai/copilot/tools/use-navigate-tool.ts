import { useFrontendTool } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import z from 'zod'

const pathSchema = z.union([
  z.literal('/').describe('首页'),
  z.literal('/chat').describe('chat页面'),
  z.literal('/chat-v2').describe('copilot页面'),
  z.literal('/bim').describe('三维场景BIM页面（threejs）'),
  z.literal('/system/roles').describe('角色管理页面'),
  z.literal('/system/users').describe('用户管理页面'),
  z.literal('/system/organization').describe('组织架构页面')
])

export function useNavigateTool() {
  const navigate = useNavigate()
  useFrontendTool({
    name: 'navigate_to_page',
    description: '当需要跳转到指定页面时，使用该工具。',
    parameters: z.object({
      path: pathSchema,
      search: z.record(z.string(), z.string())
    }),
    handler: async ({ path, search }) => {
      navigate({ to: path, search })
    }
  })
}
