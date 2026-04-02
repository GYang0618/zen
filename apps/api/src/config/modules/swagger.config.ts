import { registerConfig } from '../helper'

/**
 * Swagger 文档配置
 */
export const swaggerConfig = registerConfig('swagger', (env) => ({
  enabled: env.SWAGGER_ENABLED,
  path: env.SWAGGER_PATH,
  title: env.APP_NAME,
  description: `${env.APP_NAME} API 文档`,
  version: '1.0.0'
}))
