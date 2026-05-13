import { CopilotPopup, useAgentContext, useFrontendTool } from '@copilotkit/react-core/v2'
import { useNavigate } from '@tanstack/react-router'
import { usersQuerySchema } from '@zen/shared'
import { z } from 'zod'

import { useTheme } from '@/context/theme-provider'
import { useAuthStore } from '@/stores'
export function CopilotKitSidebar() {
  const user = useAuthStore((state) => state.user)
  const { setTheme } = useTheme()
  const navigate = useNavigate()

  useAgentContext({
    description: '当前登录的用户信息',
    value: user
  })

  useFrontendTool({
    name: 'change_theme',
    description: '改变主题, 支持亮色、暗色、跟随系统',
    parameters: z.object({
      theme: z.enum(['light', 'dark', 'system'])
    }),
    handler: async ({ theme }) => {
      setTheme(theme)
      return {
        status: 'success',
        message: '主题已改变'
      }
    }
  })

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
  return (
    <CopilotPopup
      defaultOpen={false}
      labels={{
        modalHeaderTitle: 'AI 助手',
        chatInputPlaceholder: '输入你想问的任务问题',
        welcomeMessageText: '你好！有什么我可以帮你的吗？',
        chatDisclaimerText: 'AI可能会出错，请核实重要信息。'
      }}
    />
  )
}
