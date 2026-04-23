import { envSchema } from './schema'

export function loadEnv() {
  const rawEnv = import.meta.env

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
  baseUrl: env.VITE_APP_BASE_URL,
  apiTimeout: env.VITE_APP_API_TIMEOUT,
  chatApi: env.VITE_APP_CHAT_API
}

export const useEnv = () => configs
