import { registerConfig } from '../helper'

/**
 * 数据库配置
 */
export const databaseConfig = registerConfig('database', (env) => ({
  /** 数据库连接 URL */
  url: env.DATABASE_URL
}))
