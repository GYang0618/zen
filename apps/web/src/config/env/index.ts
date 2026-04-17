import { envSchema } from './schema'

export function loadEnv() {
  const rawEnv = import.meta.env

  const { success, data, error } = envSchema.safeParse(rawEnv)

  if (!success) {
    console.error('❌ 环境变量校验失败：')
    const issues = error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(`无效的环境变量:\n${issues}`)
  }

  return data
}

export const env = loadEnv()

export const useEnv = () => ({
  baseUrl: env.VITE_APP_BASE_URL,
  apiTimeout: env.VITE_APP_API_TIMEOUT
})

export const configs = {
  baseUrl: env.VITE_APP_BASE_URL,
  apiTimeout: env.VITE_APP_API_TIMEOUT
}
