import { z } from 'zod'

export const envSchema = z.object({
  API_BASE_URL: z
    .url()
    .default('http://127.0.0.1:3000')
    .describe('后端 API 根地址（与 swagger.json 中路径前缀一致，不含尾部斜杠）'),
  OPENAI_API_KEY: z.string().describe('OpenAI API 密钥'),
  OPENAI_BASE_URL: z.url().optional().describe('OpenAI 基础 URL'),
  LANGSMITH_API_KEY: z.string().describe('LangSmith API 密钥'),
  LANGSMITH_ENDPOINT: z.url().optional().describe('LangSmith 端点 URL'),
  LANGSMITH_TRACING: z.coerce
    .boolean()
    .optional()
    .describe('LangSmith 追踪是否启用（.env 中为 true/false）'),
  LANGSMITH_PROJECT: z.string().optional().describe('LangSmith 项目')
})

export type Env = z.infer<typeof envSchema>
