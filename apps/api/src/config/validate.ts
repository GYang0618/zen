import { envSchema } from './env.schema.js'

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

  if (result.data.NODE_ENV === 'production') {
    const corsOrigin = String(rawEnv.CORS_ORIGIN ?? result.data.CORS_ORIGIN).trim()
    const jwtSecret = String(rawEnv.JWT_SECRET ?? '')
    const databaseUrl = String(rawEnv.DATABASE_URL ?? '')
    const storageSecret = String(rawEnv.STORAGE_SECRET_KEY ?? '')

    if (!corsOrigin || corsOrigin === '*') {
      throw new Error('环境变量校验失败 - 生产环境禁止使用 wildcard CORS_ORIGIN')
    }
    if (/change-me|your-jwt-secret|admin123/i.test(jwtSecret)) {
      throw new Error('环境变量校验失败 - 生产环境禁止使用占位 JWT_SECRET')
    }
    if (/:(admin123|postgres)(?:@|%40)/i.test(databaseUrl)) {
      throw new Error('环境变量校验失败 - 生产环境禁止使用示例数据库口令')
    }
    if (!storageSecret || /zenminio_secret|change-me|your-storage/i.test(storageSecret)) {
      throw new Error('环境变量校验失败 - 生产环境必须提供非占位 STORAGE_SECRET_KEY')
    }
  }

  return result.data
}
