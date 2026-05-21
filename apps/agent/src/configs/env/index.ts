import { envSchema } from './schema'

export function loadEnv() {
  const rawEnv = process.env

  const { success, data, error } = envSchema.safeParse(rawEnv)

  if (!success) {
    const issues = error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(`无效的环境变量:\n${issues}`)
  }

  return data
}

export const env = loadEnv()

export const configs = {
  openaiApiKey: env.OPENAI_API_KEY,
  openaiBaseUrl: env.OPENAI_BASE_URL,
  langsmithApiKey: env.LANGSMITH_API_KEY,
  langsmithEndpoint: env.LANGSMITH_ENDPOINT,
  langsmithTracing: env.LANGSMITH_TRACING,
  langsmithProject: env.LANGSMITH_PROJECT
}

export const useEnv = () => configs
