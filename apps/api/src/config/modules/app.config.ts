import { registerConfig } from '../helper'

/**
 * 应用程序基础配置
 */
export const appConfig = registerConfig('app', (env) => ({
  /** 应用名称 */
  name: env.APP_NAME,
  /** 应用端口 */
  port: env.PORT,
  /** API 路由前缀 */
  apiPrefix: env.API_PREFIX,
  /** 运行环境 */
  nodeEnv: env.NODE_ENV,
  /** 是否为生产环境 */
  isProd: env.NODE_ENV === 'production',
  /** 是否为开发环境 */
  isDev: env.NODE_ENV === 'development',
  /** 是否为测试环境 */
  isTest: env.NODE_ENV === 'test'
}))
