import { CONFIG_NAMESPACES } from './constants.js'

import type { ConfigType } from '@nestjs/config'
import type {
  appConfig,
  authConfig,
  databaseConfig,
  langgraphConfig,
  loggerConfig,
  securityConfig,
  storageConfig,
  swaggerConfig
} from './modules/index.js'

export type AppConfig = ConfigType<typeof appConfig>
export type AuthConfig = ConfigType<typeof authConfig>
export type DatabaseConfig = ConfigType<typeof databaseConfig>
export type LanggraphConfig = ConfigType<typeof langgraphConfig>
export type LoggerConfig = ConfigType<typeof loggerConfig>
export type SecurityConfig = ConfigType<typeof securityConfig>
export type StorageConfig = ConfigType<typeof storageConfig>
export type SwaggerConfig = ConfigType<typeof swaggerConfig>

export type Configs = {
  [CONFIG_NAMESPACES.APP]: AppConfig
  [CONFIG_NAMESPACES.AUTH]: AuthConfig
  [CONFIG_NAMESPACES.DATABASE]: DatabaseConfig
  [CONFIG_NAMESPACES.LANGGRAPH]: LanggraphConfig
  [CONFIG_NAMESPACES.LOGGER]: LoggerConfig
  [CONFIG_NAMESPACES.SECURITY]: SecurityConfig
  [CONFIG_NAMESPACES.STORAGE]: StorageConfig
  [CONFIG_NAMESPACES.SWAGGER]: SwaggerConfig
}
