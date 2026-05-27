import { useFrontendTool } from '@copilotkit/react-core/v2'
import { z } from 'zod'

import { useTheme } from '@/context/theme-provider'

const themeSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'])
})

export function useThemeTool() {
  const { setTheme } = useTheme()
  useFrontendTool({
    name: 'change_theme',
    description: '改变主题, 支持亮色、暗色、跟随系统',
    parameters: themeSchema,
    handler: async ({ theme }) => {
      setTheme(theme)
      return {
        status: 'success',
        message: '主题已改变'
      }
    }
  })
}
