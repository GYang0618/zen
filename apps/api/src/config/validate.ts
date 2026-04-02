import { envSchema } from './env.schema'

export function validate(rawEnv: Record<string, unknown>) {
  const knownEnv = Object.keys(envSchema.shape).reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = rawEnv[key]
    return acc
  }, {})

  const withDefaults = {
    ...knownEnv,
    DATABASE_URL:
      knownEnv.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/admin_placeholder?schema=public'
  }

  const result = envSchema.safeParse(withDefaults)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ')

    throw new Error(`环境变量校验失败 - ${errorMessage}`)
  }

  if (result.data.NODE_ENV === 'production' && !rawEnv.DATABASE_URL) {
    throw new Error('环境变量校验失败 - 生产环境必须提供 DATABASE_URL')
  }

  return result.data
}
