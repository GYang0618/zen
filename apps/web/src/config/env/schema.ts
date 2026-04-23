import { z } from 'zod'

export const envSchema = z.object({
  VITE_APP_BASE_URL: z.url().describe('应用基础 URL'),
  VITE_APP_API_TIMEOUT: z.coerce.number().int().positive().describe('API 超时时间'),
  VITE_APP_CHAT_API: z.url().describe('Chat API URL')
})

export type Env = z.infer<typeof envSchema>
