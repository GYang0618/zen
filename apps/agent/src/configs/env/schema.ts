import { z } from 'zod'

export const envSchema = z.object({
  OPENAI_API_KEY: z.string().describe('OpenAI API 密钥'),
  OPENAI_BASE_URL: z.url().optional().describe('OpenAI 基础 URL'),
  LANGSMITH_API_KEY: z.string().describe('LangSmith API 密钥'),
  LANGSMITH_ENDPOINT: z.url().optional().describe('LangSmith 端点 URL'),
  LANGSMITH_TRACING: z.boolean().optional().describe('LangSmith 追踪是否启用'),
  LANGSMITH_PROJECT: z.string().optional().describe('LangSmith 项目')
})

export type Env = z.infer<typeof envSchema>
