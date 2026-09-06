import {
  appConfig,
  authConfig,
  databaseConfig,
  langgraphConfig,
  loggerConfig,
  securityConfig,
  storageConfig,
  swaggerConfig
} from './modules/index.js'

/**
 * 配置命名空间键（用于 registerAs）
 */
export const CONFIG_NAMESPACES = {
  APP: appConfig.KEY,
  AUTH: authConfig.KEY,
  DATABASE: databaseConfig.KEY,
  LANGGRAPH: langgraphConfig.KEY,
  SECURITY: securityConfig.KEY,
  LOGGER: loggerConfig.KEY,
  STORAGE: storageConfig.KEY,
  SWAGGER: swaggerConfig.KEY
} as const
